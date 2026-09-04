<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\MaintenanceRecord;
use App\Services\AuditService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MaintenanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MaintenanceRecord::with(['asset.category', 'asset.location']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($assetId = $request->query('asset_id')) {
            $query->where('asset_id', $assetId);
        }

        $perPage = (int) $request->query('per_page', 15);
        $records = $query->latest('scheduled_date')->paginate($perPage);

        return response()->json($records);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'status' => ['required', Rule::in(['scheduled', 'in_progress', 'completed'])],
            'issue_description' => 'required|string',
            'provider_name' => 'nullable|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'scheduled_date' => 'required|date',
            'notes' => 'nullable|string',
            'set_asset_in_maintenance' => 'boolean',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        $record = MaintenanceRecord::create([
            'asset_id' => $asset->id,
            'status' => $validated['status'],
            'issue_description' => $validated['issue_description'],
            'provider_name' => $validated['provider_name'] ?? null,
            'cost' => $validated['cost'] ?? null,
            'scheduled_date' => $validated['scheduled_date'],
            'started_date' => $validated['status'] === 'in_progress' ? now()->toDateString() : null,
            'performed_by' => $user->name,
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($validated['status'] === 'in_progress' || !empty($validated['set_asset_in_maintenance'])) {
            $asset->update(['status' => Asset::STATUS_MAINTENANCE]);
            $asset->logHistory(
                action: 'maintenance',
                notes: "Placed in maintenance: {$validated['issue_description']}",
                userId: $user->id
            );
        }

        AuditService::log(
            action: 'maintenance_scheduled',
            entityType: 'MaintenanceRecord',
            entityId: $record->id,
            oldValues: null,
            newValues: $record->toArray(),
            userId: $user->id
        );

        return response()->json([
            'message' => 'Maintenance record created.',
            'record' => $record->load('asset'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = MaintenanceRecord::with(['asset.category', 'asset.location'])->findOrFail($id);
        return response()->json($record);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $record = MaintenanceRecord::with('asset')->findOrFail($id);

        $validated = $request->validate([
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'condition' => ['nullable', Rule::in(['excellent', 'good', 'fair'])],
        ]);

        $record->update([
            'status' => MaintenanceRecord::STATUS_COMPLETED,
            'completed_date' => now()->toDateString(),
            'cost' => $validated['cost'] ?? $record->cost,
            'notes' => $validated['notes'] ?? $record->notes,
        ]);

        // Transition asset: MAINTENANCE -> AVAILABLE
        $record->asset->update([
            'status' => Asset::STATUS_AVAILABLE,
            'condition' => $validated['condition'] ?? 'excellent',
        ]);

        $record->asset->logHistory(
            action: 'repaired',
            notes: "Maintenance completed. Asset restored to AVAILABLE condition: " . ($validated['condition'] ?? 'excellent'),
            userId: $user->id
        );

        AuditService::log(
            action: 'maintenance_completed',
            entityType: 'MaintenanceRecord',
            entityId: $record->id,
            oldValues: null,
            newValues: ['status' => 'completed', 'cost' => $record->cost],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Maintenance marked as complete. Asset is now AVAILABLE.',
            'record' => $record->fresh('asset'),
        ]);
    }
}
