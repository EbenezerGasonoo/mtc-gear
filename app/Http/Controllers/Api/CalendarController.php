<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Category;
use App\Models\Checkout;
use App\Models\GearKit;
use App\Models\GearRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * Get timeline rows (assets & gear kits) with their bookings for Gantt visualization.
     */
    public function timeline(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : now()->startOfMonth()->subDays(3);

        $endDate = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : now()->endOfMonth()->addDays(7);

        $categoryId = $request->query('category_id');
        $statusFilter = $request->query('status', 'all');
        $search = $request->query('search');

        // 1. Fetch Assets query
        $assetsQuery = Asset::with('category')->orderBy('category_id')->orderBy('name');

        if ($categoryId) {
            $assetsQuery->where('category_id', $categoryId);
        }

        if ($search) {
            $assetsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('asset_id', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        $assets = $assetsQuery->get();

        // 2. Fetch all Gear Requests overlapping this window
        $requestsQuery = GearRequest::with(['user', 'items.asset'])
            ->whereIn('status', ['APPROVED', 'PENDING', 'PARTIALLY_APPROVED', 'approved', 'pending', 'partially_approved'])
            ->where('start_date', '<=', $endDate->toDateString())
            ->where(function ($q) use ($startDate) {
                $q->where('expected_return_date', '>=', $startDate->toDateString());
            });

        $gearRequests = $requestsQuery->get();

        // 3. Fetch all active or overlapping Checkouts
        $checkouts = Checkout::with(['user', 'request', 'items.asset'])
            ->whereIn('status', ['CHECKED_OUT', 'OVERDUE', 'RETURNED'])
            ->where(function ($q) use ($startDate, $endDate) {
                $q->where('checked_out_at', '<=', $endDate)
                  ->where(function ($sub) use ($startDate) {
                      $sub->whereNull('returned_at')
                          ->orWhere('returned_at', '>=', $startDate);
                  });
            })
            ->get();

        // 4. Build timeline rows
        $timelineRows = [];
        $totalConflictsCount = 0;
        $activeDeploymentsCount = 0;
        $upcomingBookingsCount = 0;

        foreach ($assets as $asset) {
            $assetBookings = [];

            // A. Checkouts on this asset
            foreach ($checkouts as $co) {
                $hasAsset = $co->items->contains('asset_id', $asset->id);
                if (!$hasAsset) continue;

                $coStart = Carbon::parse($co->checked_out_at)->startOfDay();
                $coEnd = $co->expected_return_at ? Carbon::parse($co->expected_return_at)->endOfDay() : $coStart->copy()->addDays(2);
                if ($co->returned_at) {
                    $coEnd = Carbon::parse($co->returned_at)->endOfDay();
                }

                $bookingStatus = $co->status; // CHECKED_OUT, OVERDUE, RETURNED
                if ($bookingStatus === 'CHECKED_OUT') {
                    $activeDeploymentsCount++;
                }

                $assetBookings[] = [
                    'id' => 'co-' . $co->id,
                    'record_id' => $co->id,
                    'type' => 'checkout',
                    'project_name' => $co->request->project_name ?? 'Direct Field Deployment',
                    'user_name' => $co->user->name ?? 'Crew Member',
                    'user_email' => $co->user->email ?? '',
                    'start_date' => $coStart->format('Y-m-d'),
                    'end_date' => $coEnd->format('Y-m-d'),
                    'status' => $bookingStatus,
                    'notes' => $co->notes,
                    'has_conflict' => false,
                    'conflict_reason' => null,
                ];
            }

            // B. Requests on this asset
            foreach ($gearRequests as $gr) {
                $hasAsset = $gr->items->contains(function ($item) use ($asset) {
                    if ($item->asset_id == $asset->id) return true;
                    if ($item->gear_kit_id) {
                        return $item->gearKit && $item->gearKit->items->contains('asset_id', $asset->id);
                    }
                    return false;
                });

                if (!$hasAsset) continue;

                // If already checked out for this request, avoid duplicate visualization
                $alreadyCheckedOut = $checkouts->contains(fn($c) => $c->gear_request_id === $gr->id);
                if ($alreadyCheckedOut) continue;

                $upcomingBookingsCount++;

                $assetBookings[] = [
                    'id' => 'req-' . $gr->id,
                    'record_id' => $gr->id,
                    'type' => 'request',
                    'project_name' => $gr->project_name,
                    'user_name' => $gr->user->name ?? 'Requester',
                    'user_email' => $gr->user->email ?? '',
                    'start_date' => Carbon::parse($gr->start_date)->format('Y-m-d'),
                    'end_date' => Carbon::parse($gr->expected_return_date ?? $gr->start_date)->format('Y-m-d'),
                    'status' => strtoupper($gr->status), // APPROVED, PENDING
                    'notes' => $gr->notes,
                    'has_conflict' => false,
                    'conflict_reason' => null,
                ];
            }

            // C. Sort bookings chronologically
            usort($assetBookings, fn($a, $b) => strcmp($a['start_date'], $b['start_date']));

            // D. Conflict & Turnaround detection for this asset
            $count = count($assetBookings);
            for ($i = 0; $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    $b1 = &$assetBookings[$i];
                    $b2 = &$assetBookings[$j];

                    $b1Start = $b1['start_date'];
                    $b1End = $b1['end_date'];
                    $b2Start = $b2['start_date'];
                    $b2End = $b2['end_date'];

                    // Direct overlap check: max(start1, start2) <= min(end1, end2)
                    if (max($b1Start, $b2Start) <= min($b1End, $b2End)) {
                        $b1['has_conflict'] = true;
                        $b2['has_conflict'] = true;
                        $b1['conflict_reason'] = "Direct booking overlap with {$b2['project_name']} ({$b2['user_name']})";
                        $b2['conflict_reason'] = "Direct booking overlap with {$b1['project_name']} ({$b1['user_name']})";
                        $totalConflictsCount++;
                    }
                    // Tight turnaround check: b1End and b2Start are consecutive or same day
                    elseif (Carbon::parse($b1End)->diffInHours(Carbon::parse($b2Start)) <= 24) {
                        if (!$b2['has_conflict']) {
                            $b2['is_tight_turnaround'] = true;
                            $b2['conflict_reason'] = "Tight turnaround (<24h) after {$b1['project_name']}";
                        }
                    }
                }
            }

            // Status filter check
            if ($statusFilter !== 'all') {
                $assetBookings = array_values(array_filter($assetBookings, function ($b) use ($statusFilter) {
                    return strtolower($b['status']) === strtolower($statusFilter);
                }));
            }

            $timelineRows[] = [
                'id' => $asset->id,
                'asset_id' => $asset->asset_id,
                'asset_tag' => $asset->asset_id,
                'name' => $asset->name,
                'model' => $asset->model,
                'status' => $asset->status,
                'category_name' => $asset->category->name ?? 'General',
                'category_color' => $asset->category->color ?? '#386642',
                'bookings' => $assetBookings,
                'has_active_conflict' => collect($assetBookings)->contains('has_conflict', true),
            ];
        }

        return response()->json([
            'date_range' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'stats' => [
                'total_assets' => $assets->count(),
                'active_deployments' => $activeDeploymentsCount,
                'upcoming_bookings' => $upcomingBookingsCount,
                'detected_conflicts' => $totalConflictsCount,
            ],
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'timeline' => $timelineRows,
        ]);
    }

    /**
     * Get isolated list of current and upcoming booking conflicts.
     */
    public function conflicts(): JsonResponse
    {
        $requests = GearRequest::with(['user', 'items.asset'])
            ->whereIn('status', ['APPROVED', 'PENDING', 'approved', 'pending'])
            ->where(function ($q) {
                $q->where('expected_return_date', '>=', now()->toDateString());
            })
            ->orderBy('start_date')
            ->get();

        $conflicts = [];

        for ($i = 0; $i < count($requests); $i++) {
            for ($j = $i + 1; $j < count($requests); $j++) {
                $r1 = $requests[$i];
                $r2 = $requests[$j];

                $r1Start = Carbon::parse($r1->start_date)->format('Y-m-d');
                $r1End = Carbon::parse($r1->expected_return_date ?? $r1->start_date)->format('Y-m-d');
                $r2Start = Carbon::parse($r2->start_date)->format('Y-m-d');
                $r2End = Carbon::parse($r2->expected_return_date ?? $r2->start_date)->format('Y-m-d');

                // Check date overlap
                if (max($r1Start, $r2Start) <= min($r1End, $r2End)) {
                    $sharedAssets = [];
                    foreach ($r1->items as $item1) {
                        if (!$item1->asset_id) continue;
                        if ($r2->items->contains('asset_id', $item1->asset_id)) {
                            $sharedAssets[] = [
                                'id' => $item1->asset->id,
                                'name' => $item1->asset->name,
                                'asset_id' => $item1->asset->asset_id,
                                'asset_tag' => $item1->asset->asset_id,
                            ];
                        }
                    }

                    if (!empty($sharedAssets)) {
                        $conflicts[] = [
                            'conflict_id' => "cnf-{$r1->id}-{$r2->id}",
                            'request_1' => [
                                'id' => $r1->id,
                                'project_name' => $r1->project_name,
                                'user' => $r1->user->name ?? 'Requester',
                                'dates' => "{$r1Start} to {$r1End}",
                                'status' => strtoupper($r1->status),
                            ],
                            'request_2' => [
                                'id' => $r2->id,
                                'project_name' => $r2->project_name,
                                'user' => $r2->user->name ?? 'Requester',
                                'dates' => "{$r2Start} to {$r2End}",
                                'status' => strtoupper($r2->status),
                            ],
                            'shared_equipment' => $sharedAssets,
                            'overlap_start' => max($r1Start, $r2Start),
                            'overlap_end' => min($r1End, $r2End),
                        ];
                    }
                }
            }
        }

        return response()->json([
            'count' => count($conflicts),
            'conflicts' => $conflicts,
        ]);
    }
}
