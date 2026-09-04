<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Checkout;
use App\Models\GearRequest;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\ReturnRecord;
use App\Services\AuditService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ReturnRecord::with(['user', 'receiver', 'checkout.request', 'items.asset.category']);

        if ($user->role === 'staff') {
            $query->where('user_id', $user->id);
        }

        $perPage = (int) $request->query('per_page', 15);
        $returns = $query->latest('return_date')->paginate($perPage);

        return response()->json($returns);
    }

    public function store(Request $request): JsonResponse
    {
        $receiver = $request->user();

        $validated = $request->validate([
            'checkout_id' => 'required|exists:checkouts,id',
            'return_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.asset_id' => 'required|exists:assets,id',
            'items.*.condition' => 'required|string',
            'items.*.is_damaged' => 'boolean',
            'items.*.is_missing' => 'boolean',
            'items.*.requires_maintenance' => 'boolean',
            'items.*.notes' => 'nullable|string',
        ]);

        $checkout = Checkout::with(['user', 'request', 'items'])->findOrFail($validated['checkout_id']);

        if ($checkout->status === Checkout::STATUS_RETURNED) {
            return response()->json(['message' => 'This checkout has already been returned.'], 422);
        }

        $returnDate = !empty($validated['return_date']) ? Carbon::parse($validated['return_date']) : now();

        $returnRecord = DB::transaction(function () use ($checkout, $receiver, $validated, $returnDate) {
            $hasDamage = false;
            $hasMissing = false;

            // 1. Create Return Record
            $returnRecord = ReturnRecord::create([
                'checkout_id' => $checkout->id,
                'user_id' => $checkout->user_id,
                'receiver_id' => $receiver->id,
                'return_date' => $returnDate,
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            // 2. Create Post-Return Inspection
            $inspection = Inspection::create([
                'checkout_id' => $checkout->id,
                'type' => Inspection::TYPE_POST_RETURN,
                'inspector_id' => $receiver->id,
                'inspected_at' => now(),
                'overall_passed' => true,
                'notes' => 'Return check-in inspection by ' . $receiver->name,
            ]);

            // 3. Process each item
            foreach ($validated['items'] as $itemData) {
                $asset = Asset::findOrFail($itemData['asset_id']);
                $isDamaged = $itemData['is_damaged'] ?? false;
                $isMissing = $itemData['is_missing'] ?? false;
                $requiresMaint = $itemData['requires_maintenance'] ?? false;

                if ($isDamaged) $hasDamage = true;
                if ($isMissing) $hasMissing = true;

                $returnRecord->items()->create([
                    'asset_id' => $asset->id,
                    'condition_after' => $itemData['condition'],
                    'is_damaged' => $isDamaged,
                    'is_missing' => $isMissing,
                    'requires_maintenance' => $requiresMaint,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $inspection->items()->create([
                    'asset_id' => $asset->id,
                    'condition' => $itemData['condition'],
                    'damage_notes' => $itemData['notes'] ?? null,
                ]);

                // Determine new status for the asset
                $newStatus = Asset::STATUS_AVAILABLE;
                if ($isMissing) {
                    $newStatus = Asset::STATUS_LOST;
                } elseif ($isDamaged) {
                    $newStatus = Asset::STATUS_DAMAGED;
                } elseif ($requiresMaint) {
                    $newStatus = Asset::STATUS_MAINTENANCE;
                }

                $asset->update([
                    'status' => $newStatus,
                    'condition' => $itemData['condition'],
                    'assigned_user_id' => null,
                ]);

                // Record history
                $asset->logHistory(
                    action: 'returned',
                    notes: "Returned by {$checkout->user->name}. Inspected by {$receiver->name}. Condition: {$itemData['condition']}. Status now: " . strtoupper($newStatus) . ".",
                    projectName: $checkout->request ? $checkout->request->project_name : null,
                    userId: $receiver->id
                );

                // Automatic incident creation if damaged or missing
                if ($isDamaged || $isMissing) {
                    $incidentType = $isMissing ? Incident::TYPE_LOST : Incident::TYPE_DAMAGE;
                    $severity = $isMissing ? Incident::SEVERITY_HIGH : Incident::SEVERITY_MEDIUM;

                    Incident::create([
                        'incident_number' => Incident::generateIncidentNumber(),
                        'asset_id' => $asset->id,
                        'reported_by_id' => $receiver->id,
                        'checkout_id' => $checkout->id,
                        'type' => $incidentType,
                        'severity' => $severity,
                        'incident_date' => now()->toDateString(),
                        'project_name' => $checkout->request ? $checkout->request->project_name : 'Equipment Deployment',
                        'description' => $itemData['notes'] ?? "Automatic incident flagged during return check-in for asset {$asset->name} ({$asset->asset_id}).",
                    ]);
                }
            }

            // 4. Update checkout & request statuses
            $checkoutStatus = Checkout::STATUS_RETURNED;
            if ($hasDamage) {
                $returnRecord->update(['status' => 'damaged']);
            } elseif ($hasMissing) {
                $returnRecord->update(['status' => 'missing_items']);
            }

            $checkout->update(['status' => $checkoutStatus]);
            if ($checkout->request) {
                $checkout->request->update(['status' => GearRequest::STATUS_RETURNED]);
            }

            return $returnRecord;
        });

        NotificationService::send(
            userId: $checkout->user_id,
            type: 'equipment_returned',
            title: "Equipment Returned & Inspected",
            message: "Your returned equipment for project '{$checkout->request->project_name}' has been processed by {$receiver->name}.",
            link: "/returns/{$returnRecord->id}"
        );

        AuditService::log(
            action: 'equipment_returned',
            entityType: 'ReturnRecord',
            entityId: $returnRecord->id,
            oldValues: null,
            newValues: $returnRecord->load('items')->toArray(),
            userId: $receiver->id
        );

        return response()->json([
            'message' => 'Equipment returned and checked in successfully.',
            'return' => $returnRecord->load(['user', 'receiver', 'items.asset']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $returnRecord = ReturnRecord::with([
            'user',
            'receiver',
            'checkout.request',
            'checkout.inspections',
            'items.asset.category',
            'items.asset.location',
        ])->findOrFail($id);

        return response()->json($returnRecord);
    }
}
