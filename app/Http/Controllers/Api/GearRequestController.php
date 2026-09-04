<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\GearRequest;
use App\Models\GearRequestItem;
use App\Services\AuditService;
use App\Services\AvailabilityService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class GearRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = GearRequest::with(['user', 'items.asset.category', 'items.asset.location', 'approvedBy', 'checkout']);

        // Role restriction: Staff sees only their requests; Overseer/SuperAdmin sees all
        if ($user->role === 'staff') {
            $query->where('user_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('project_name', 'like', "%{$search}%")
                  ->orWhere('destination_location', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $requests = $query->latest()->paginate($perPage);

        return response()->json($requests);
    }

    public function checkAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'expected_return_date' => 'required|date|after_or_equal:start_date',
            'asset_ids' => 'required|array|min:1',
            'asset_ids.*' => 'required|exists:assets,id',
            'exclude_request_id' => 'nullable|integer',
        ]);

        $results = AvailabilityService::checkMultiple(
            $request->asset_ids,
            $request->start_date,
            $request->expected_return_date,
            $request->exclude_request_id
        );

        $hasConflicts = collect($results)->contains(fn($r) => $r['is_available'] === false);

        return response()->json([
            'has_conflicts' => $hasConflicts,
            'availability' => $results,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'purpose' => 'required|string',
            'destination_location' => 'required|string|max:255',
            'start_date' => 'required|date|after_or_equal:today',
            'start_time' => 'nullable',
            'expected_return_date' => 'required|date|after_or_equal:start_date',
            'expected_return_time' => 'nullable',
            'notes' => 'nullable|string',
            'asset_ids' => 'required|array|min:1',
            'asset_ids.*' => 'required|exists:assets,id',
            'admin_override_reason' => 'nullable|string',
        ]);

        // Availability collision check
        $conflicts = [];
        foreach ($validated['asset_ids'] as $assetId) {
            $check = AvailabilityService::checkAsset($assetId, $validated['start_date'], $validated['expected_return_date']);
            if (!$check['is_available']) {
                $asset = Asset::find($assetId);
                $conflicts[] = [
                    'asset_id' => $assetId,
                    'name' => $asset ? $asset->name : "Asset #{$assetId}",
                    'reason' => $check['reason'],
                ];
            }
        }

        // If conflicts exist, verify admin override
        if (!empty($conflicts)) {
            if (!$user->canManageEquipment() || empty($validated['admin_override_reason'])) {
                return response()->json([
                    'message' => 'Selected equipment is unavailable for the requested dates.',
                    'conflicts' => $conflicts,
                ], 422);
            }
        }

        $gearRequest = GearRequest::create([
            'request_number' => GearRequest::generateRequestNumber(),
            'user_id' => $user->id,
            'project_name' => $validated['project_name'],
            'purpose' => $validated['purpose'],
            'destination_location' => $validated['destination_location'],
            'start_date' => $validated['start_date'],
            'start_time' => $validated['start_time'] ?? null,
            'expected_return_date' => $validated['expected_return_date'],
            'expected_return_time' => $validated['expected_return_time'] ?? null,
            'status' => GearRequest::STATUS_PENDING,
            'notes' => $validated['notes'] ?? null,
            'admin_override_reason' => $validated['admin_override_reason'] ?? null,
        ]);

        foreach ($validated['asset_ids'] as $assetId) {
            $gearRequest->items()->create([
                'asset_id' => $assetId,
                'status' => 'pending',
            ]);
        }

        // Notify overseers
        NotificationService::notifyOverseers(
            type: 'request_submitted',
            title: "New Gear Request: {$gearRequest->request_number}",
            message: "{$user->name} requested {$gearRequest->items()->count()} items for project '{$gearRequest->project_name}'.",
            link: "/requests/{$gearRequest->id}"
        );

        AuditService::log(
            action: 'request_submitted',
            entityType: 'GearRequest',
            entityId: $gearRequest->id,
            oldValues: null,
            newValues: $gearRequest->load('items')->toArray(),
            userId: $user->id
        );

        return response()->json([
            'message' => 'Equipment request submitted successfully.',
            'request' => $gearRequest->load(['user', 'items.asset']),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $gearRequest = GearRequest::with([
            'user',
            'items.asset.category',
            'items.asset.location',
            'approvedBy',
            'checkout.inspector',
            'checkout.inspections',
            'checkout.returns'
        ])->findOrFail($id);

        if ($user->role === 'staff' && $gearRequest->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to view this request.'], 403);
        }

        // Augment items with real-time availability status for overseer review
        $itemsWithAvailability = $gearRequest->items->map(function ($item) use ($gearRequest) {
            $check = AvailabilityService::checkAsset(
                $item->asset_id,
                $gearRequest->start_date,
                $gearRequest->expected_return_date,
                $gearRequest->id
            );
            $arr = $item->toArray();
            $arr['availability'] = $check;
            return $arr;
        });

        $resp = $gearRequest->toArray();
        $resp['items'] = $itemsWithAvailability;

        return response()->json($resp);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $gearRequest = GearRequest::with('items.asset')->findOrFail($id);

        // Rule: Staff cannot approve their own requests
        if ($gearRequest->user_id === $user->id && $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'You cannot approve your own equipment request.',
            ], 403);
        }

        $oldStatus = $gearRequest->status;

        $gearRequest->update([
            'status' => GearRequest::STATUS_APPROVED,
            'approved_by_id' => $user->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        $gearRequest->items()->update(['status' => 'approved']);

        // Log in asset history for reserved equipment
        foreach ($gearRequest->items as $item) {
            $item->asset->logHistory(
                action: 'reserved',
                notes: "Reserved for {$gearRequest->user->name} on project '{$gearRequest->project_name}' from " .
                       Carbon::parse($gearRequest->start_date)->format('d M Y') . " to " .
                       Carbon::parse($gearRequest->expected_return_date)->format('d M Y') . ".",
                projectName: $gearRequest->project_name,
                userId: $user->id
            );
        }

        NotificationService::send(
            userId: $gearRequest->user_id,
            type: 'request_approved',
            title: "Request Approved: {$gearRequest->request_number}",
            message: "Your equipment request for '{$gearRequest->project_name}' has been approved.",
            link: "/requests/{$gearRequest->id}"
        );

        AuditService::log(
            action: 'request_approved',
            entityType: 'GearRequest',
            entityId: $gearRequest->id,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => 'approved', 'approved_by' => $user->id],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Request approved successfully.',
            'request' => $gearRequest->fresh(['user', 'items.asset', 'approvedBy']),
        ]);
    }

    public function partiallyApprove(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $gearRequest = GearRequest::with('items')->findOrFail($id);

        if ($gearRequest->user_id === $user->id && $user->role !== 'super_admin') {
            return response()->json(['message' => 'You cannot approve your own request.'], 403);
        }

        $validated = $request->validate([
            'approved_asset_ids' => 'required|array|min:1',
            'approved_asset_ids.*' => 'required|exists:assets,id',
            'notes' => 'nullable|string',
        ]);

        $gearRequest->update([
            'status' => GearRequest::STATUS_PARTIALLY_APPROVED,
            'approved_by_id' => $user->id,
            'approved_at' => now(),
            'notes' => $validated['notes'] ?? $gearRequest->notes,
        ]);

        foreach ($gearRequest->items as $item) {
            $isApproved = in_array($item->asset_id, $validated['approved_asset_ids']);
            $item->update(['status' => $isApproved ? 'approved' : 'rejected']);
        }

        NotificationService::send(
            userId: $gearRequest->user_id,
            type: 'request_partially_approved',
            title: "Request Partially Approved: {$gearRequest->request_number}",
            message: "Some items in your request for '{$gearRequest->project_name}' have been approved.",
            link: "/requests/{$gearRequest->id}"
        );

        AuditService::log(
            action: 'request_partially_approved',
            entityType: 'GearRequest',
            entityId: $gearRequest->id,
            oldValues: null,
            newValues: ['status' => 'partially_approved', 'approved_items' => $validated['approved_asset_ids']],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Request partially approved.',
            'request' => $gearRequest->fresh(['user', 'items.asset', 'approvedBy']),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $gearRequest = GearRequest::findOrFail($id);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:5',
        ]);

        $oldStatus = $gearRequest->status;

        $gearRequest->update([
            'status' => GearRequest::STATUS_REJECTED,
            'rejection_reason' => $validated['rejection_reason'],
            'approved_by_id' => $user->id,
        ]);

        $gearRequest->items()->update(['status' => 'rejected']);

        NotificationService::send(
            userId: $gearRequest->user_id,
            type: 'request_rejected',
            title: "Request Rejected: {$gearRequest->request_number}",
            message: "Reason: {$validated['rejection_reason']}",
            link: "/requests/{$gearRequest->id}"
        );

        AuditService::log(
            action: 'request_rejected',
            entityType: 'GearRequest',
            entityId: $gearRequest->id,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => 'rejected', 'reason' => $validated['rejection_reason']],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Request rejected.',
            'request' => $gearRequest->fresh(['user', 'items.asset']),
        ]);
    }

    public function requestChanges(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $gearRequest = GearRequest::findOrFail($id);

        $validated = $request->validate([
            'change_request_notes' => 'required|string|min:5',
        ]);

        $gearRequest->update([
            'status' => GearRequest::STATUS_UNDER_REVIEW,
            'change_request_notes' => $validated['change_request_notes'],
        ]);

        NotificationService::send(
            userId: $gearRequest->user_id,
            type: 'request_changes_required',
            title: "Changes Requested on: {$gearRequest->request_number}",
            message: "Notes: {$validated['change_request_notes']}",
            link: "/requests/{$gearRequest->id}"
        );

        AuditService::log(
            action: 'request_changes_requested',
            entityType: 'GearRequest',
            entityId: $gearRequest->id,
            oldValues: null,
            newValues: ['status' => 'under_review', 'notes' => $validated['change_request_notes']],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Change request submitted to user.',
            'request' => $gearRequest->fresh(['user', 'items.asset']),
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $gearRequest = GearRequest::findOrFail($id);

        if ($gearRequest->user_id !== $user->id && !$user->canManageEquipment()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (in_array($gearRequest->status, [GearRequest::STATUS_CHECKED_OUT, GearRequest::STATUS_RETURNED])) {
            return response()->json(['message' => 'Cannot cancel a request that has already been deployed.'], 422);
        }

        $oldStatus = $gearRequest->status;
        $gearRequest->update(['status' => GearRequest::STATUS_CANCELLED]);

        AuditService::log(
            action: 'request_cancelled',
            entityType: 'GearRequest',
            entityId: $gearRequest->id,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => 'cancelled'],
            userId: $user->id
        );

        return response()->json(['message' => 'Request cancelled successfully.']);
    }
}
