<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AuditLog;
use App\Models\Checkout;
use App\Models\GearRequest;
use App\Models\Incident;
use App\Models\MaintenanceRecord;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $today = Carbon::today();

        // 1. Inventory Overview
        $inventoryStats = [
            'total' => Asset::count(),
            'available' => Asset::where('status', Asset::STATUS_AVAILABLE)->count(),
            'reserved' => Asset::where('status', Asset::STATUS_RESERVED)->count(),
            'checked_out' => Asset::where('status', Asset::STATUS_CHECKED_OUT)->count(),
            'maintenance' => Asset::where('status', Asset::STATUS_MAINTENANCE)->count(),
            'damaged' => Asset::where('status', Asset::STATUS_DAMAGED)->count(),
            'lost' => Asset::where('status', Asset::STATUS_LOST)->count(),
            'retired' => Asset::where('status', Asset::STATUS_RETIRED)->count(),
        ];

        // 2. Request Overview
        $requestStats = [
            'pending' => GearRequest::whereIn('status', [GearRequest::STATUS_PENDING, GearRequest::STATUS_UNDER_REVIEW])->count(),
            'approved' => GearRequest::where('status', GearRequest::STATUS_APPROVED)->count(),
            'rejected' => GearRequest::where('status', GearRequest::STATUS_REJECTED)->count(),
            'due_today' => Checkout::where('status', Checkout::STATUS_CHECKED_OUT)
                ->whereDate('expected_return_date', $today)
                ->count(),
            'overdue' => Checkout::where('status', Checkout::STATUS_OVERDUE)
                ->orWhere(function ($query) use ($today) {
                    $query->where('status', Checkout::STATUS_CHECKED_OUT)
                          ->where('expected_return_date', '<', now());
                })
                ->count(),
        ];

        // 3. Recent Activity (latest audit logs)
        $recentActivity = AuditLog::with('user')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user ? $log->user->name : 'System',
                    'action' => $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'new_values' => $log->new_values,
                    'created_at' => $log->created_at->toIso8601String(),
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            });

        // 4. Upcoming Returns
        $upcomingReturns = Checkout::with(['user', 'request', 'items.asset'])
            ->whereIn('status', [Checkout::STATUS_CHECKED_OUT, Checkout::STATUS_OVERDUE])
            ->orderBy('expected_return_date', 'asc')
            ->limit(6)
            ->get()
            ->map(function ($co) {
                $returnDate = Carbon::parse($co->expected_return_date);
                $isOverdue = $returnDate->isPast();
                $diff = $returnDate->diffForHumans(['parts' => 1]);

                return [
                    'id' => $co->id,
                    'borrower' => $co->user ? $co->user->name : 'Staff Member',
                    'project' => $co->request ? $co->request->project_name : 'General Project',
                    'expected_return_date' => $returnDate->format('d M Y, H:i'),
                    'is_overdue' => $isOverdue,
                    'days_remaining_text' => $isOverdue ? "Overdue ({$diff})" : "Due {$diff}",
                    'item_count' => $co->items->count(),
                    'items_summary' => $co->items->map(fn($i) => $i->asset ? $i->asset->name : 'Equipment Item')->take(3)->implode(', '),
                ];
            });

        // 5. Alerts Summary
        $alerts = [
            'overdue_count' => $requestStats['overdue'],
            'damaged_count' => $inventoryStats['damaged'],
            'pending_approvals_count' => $requestStats['pending'],
            'maintenance_due_count' => MaintenanceRecord::whereIn('status', ['scheduled', 'in_progress'])->count(),
        ];

        return response()->json([
            'inventory' => $inventoryStats,
            'requests' => $requestStats,
            'recent_activity' => $recentActivity,
            'upcoming_returns' => $upcomingReturns,
            'alerts' => $alerts,
        ]);
    }
}
