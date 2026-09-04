<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Checkout;
use App\Models\CheckoutItem;
use App\Models\GearRequest;
use App\Models\Inspection;
use App\Services\AuditService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Checkout::with(['user', 'inspector', 'request', 'items.asset.category']);

        if ($user->role === 'staff') {
            $query->where('user_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $perPage = (int) $request->query('per_page', 15);
        $checkouts = $query->latest('checkout_date')->paginate($perPage);

        return response()->json($checkouts);
    }

    public function store(Request $request): JsonResponse
    {
        $inspector = $request->user();

        $validated = $request->validate([
            'gear_request_id' => 'required|exists:gear_requests,id',
            'checkout_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.asset_id' => 'required|exists:assets,id',
            'items.*.condition' => 'required|string',
            'items.*.accessories_included' => 'nullable|array',
            'items.*.notes' => 'nullable|string',
        ]);

        $gearRequest = GearRequest::with(['user', 'items'])->findOrFail($validated['gear_request_id']);

        // Only approved or partially_approved requests can be checked out
        if (!in_array($gearRequest->status, [GearRequest::STATUS_APPROVED, GearRequest::STATUS_PARTIALLY_APPROVED])) {
            return response()->json([
                'message' => 'Only approved requests can be checked out. Current status: ' . strtoupper($gearRequest->status),
            ], 422);
        }

        $checkoutDate = !empty($validated['checkout_date']) ? Carbon::parse($validated['checkout_date']) : now();

        $checkout = DB::transaction(function () use ($gearRequest, $inspector, $validated, $checkoutDate) {
            // 1. Create Checkout record
            $checkout = Checkout::create([
                'gear_request_id' => $gearRequest->id,
                'user_id' => $gearRequest->user_id,
                'inspector_id' => $inspector->id,
                'checkout_date' => $checkoutDate,
                'expected_return_date' => Carbon::parse($gearRequest->expected_return_date)->setTime(18, 0),
                'status' => Checkout::STATUS_CHECKED_OUT,
                'notes' => $validated['notes'] ?? null,
            ]);

            // 2. Create Pre-checkout Inspection
            $inspection = Inspection::create([
                'checkout_id' => $checkout->id,
                'type' => Inspection::TYPE_PRE_CHECKOUT,
                'inspector_id' => $inspector->id,
                'inspected_at' => now(),
                'overall_passed' => true,
                'notes' => 'Pre-checkout inspection completed by ' . $inspector->name,
            ]);

            // 3. Process Checkout Items & Asset state transition
            foreach ($validated['items'] as $itemData) {
                $asset = Asset::findOrFail($itemData['asset_id']);

                // Ensure asset is not already checked out
                if ($asset->status === Asset::STATUS_CHECKED_OUT) {
                    throw new \Exception("Asset '{$asset->name}' ({$asset->asset_id}) is already marked as Checked Out.");
                }

                $checkout->items()->create([
                    'asset_id' => $asset->id,
                    'condition_before' => $itemData['condition'],
                    'accessories_included' => $itemData['accessories_included'] ?? [],
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $inspection->items()->create([
                    'asset_id' => $asset->id,
                    'condition' => $itemData['condition'],
                    'accessories_verified' => $itemData['accessories_included'] ?? [],
                    'damage_notes' => null,
                ]);

                // Transition asset status: AVAILABLE -> CHECKED_OUT
                $oldStatus = $asset->status;
                $asset->update([
                    'status' => Asset::STATUS_CHECKED_OUT,
                    'condition' => $itemData['condition'],
                    'assigned_user_id' => $gearRequest->user_id,
                ]);

                // Record history
                $asset->logHistory(
                    action: 'checked_out',
                    notes: "Checked out to {$gearRequest->user->name} for project '{$gearRequest->project_name}'. Inspected by {$inspector->name}. Condition: {$itemData['condition']}.",
                    projectName: $gearRequest->project_name,
                    userId: $inspector->id
                );
            }

            // 4. Update request status to checked_out
            $gearRequest->update(['status' => GearRequest::STATUS_CHECKED_OUT]);

            return $checkout;
        });

        // Notifications
        NotificationService::send(
            userId: $gearRequest->user_id,
            type: 'equipment_checked_out',
            title: "Equipment Deployed: {$gearRequest->request_number}",
            message: "Your equipment has been checked out by {$inspector->name}. Please review and digitally acknowledge receipt.",
            link: "/checkouts/{$checkout->id}"
        );

        AuditService::log(
            action: 'equipment_checked_out',
            entityType: 'Checkout',
            entityId: $checkout->id,
            oldValues: null,
            newValues: $checkout->load('items')->toArray(),
            userId: $inspector->id
        );

        return response()->json([
            'message' => 'Equipment successfully checked out.',
            'checkout' => $checkout->load(['user', 'inspector', 'items.asset', 'inspections']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $checkout = Checkout::with([
            'user',
            'inspector',
            'request',
            'items.asset.category',
            'items.asset.location',
            'inspections.inspector',
            'inspections.items.asset',
            'returns.receiver',
            'returns.items.asset',
        ])->findOrFail($id);

        return response()->json($checkout);
    }

    public function acknowledgeHandover(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $checkout = Checkout::with(['user', 'request'])->findOrFail($id);

        // Verify that current user is the designated borrower
        if ($checkout->user_id !== $user->id && $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Only the borrower can sign for equipment handover.',
            ], 403);
        }

        $validated = $request->validate([
            'acknowledgment_text' => 'required|string',
            'signature_data' => 'nullable|string',
        ]);

        $signatureHash = hash('sha256', $user->id . '|' . $checkout->id . '|' . now()->toIso8601String() . '|' . $request->ip());

        $checkout->update([
            'handover_signed_at' => now(),
            'handover_ip' => $request->ip(),
            'handover_user_agent' => $request->userAgent(),
            'digital_signature_hash' => $signatureHash,
        ]);

        NotificationService::notifyOverseers(
            type: 'handover_acknowledged',
            title: "Handover Signed: {$checkout->request->request_number}",
            message: "{$user->name} has confirmed and signed receipt of equipment for '{$checkout->request->project_name}'.",
            link: "/checkouts/{$checkout->id}"
        );

        AuditService::log(
            action: 'handover_signed',
            entityType: 'Checkout',
            entityId: $checkout->id,
            oldValues: null,
            newValues: [
                'handover_signed_at' => $checkout->handover_signed_at,
                'signature_hash' => $signatureHash,
                'ip' => $request->ip(),
            ],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Handover acknowledged and digitally signed successfully.',
            'checkout' => $checkout->fresh(),
        ]);
    }
}
