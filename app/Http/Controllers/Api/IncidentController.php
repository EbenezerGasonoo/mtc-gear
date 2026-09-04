<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Incident;
use App\Services\AuditService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IncidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Incident::with(['asset.category', 'reportedBy', 'resolvedBy', 'photos']);

        if ($severity = $request->query('severity')) {
            $query->where('severity', $severity);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->query('status')) {
            if ($status === 'resolved') {
                $query->whereNotNull('resolved_at');
            } elseif ($status === 'unresolved') {
                $query->whereNull('resolved_at');
            }
        }

        $perPage = (int) $request->query('per_page', 15);
        $incidents = $query->latest('incident_date')->paginate($perPage);

        return response()->json($incidents);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'type' => ['required', Rule::in(['damage', 'missing', 'lost', 'technical_fault', 'accessory_missing', 'other'])],
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'incident_date' => 'required|date',
            'project_name' => 'nullable|string|max:255',
            'description' => 'required|string',
            'set_asset_status' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:10240',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        $incident = Incident::create([
            'incident_number' => Incident::generateIncidentNumber(),
            'asset_id' => $asset->id,
            'reported_by_id' => $user->id,
            'type' => $validated['type'],
            'severity' => $validated['severity'],
            'incident_date' => $validated['incident_date'],
            'project_name' => $validated['project_name'] ?? null,
            'description' => $validated['description'],
        ]);

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photoFile) {
                $path = $photoFile->store('incidents', 'public');
                $incident->photos()->create(['file_path' => $path]);
            }
        }

        if (!empty($validated['set_asset_status'])) {
            $asset->update(['status' => $validated['set_asset_status']]);
        }

        $asset->logHistory(
            action: 'damaged',
            notes: "Incident {$incident->incident_number} filed: {$validated['description']}",
            projectName: $validated['project_name'] ?? null,
            userId: $user->id
        );

        NotificationService::notifyOverseers(
            type: 'incident_reported',
            title: "Incident Reported: {$incident->incident_number}",
            message: "A {$validated['severity']} severity incident was logged for {$asset->name}.",
            link: "/incidents/{$incident->id}"
        );

        AuditService::log(
            action: 'incident_created',
            entityType: 'Incident',
            entityId: $incident->id,
            oldValues: null,
            newValues: $incident->toArray(),
            userId: $user->id
        );

        return response()->json([
            'message' => 'Incident reported successfully.',
            'incident' => $incident->load(['asset', 'reportedBy', 'photos']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $incident = Incident::with(['asset.category', 'asset.location', 'reportedBy', 'resolvedBy', 'photos'])->findOrFail($id);
        return response()->json($incident);
    }

    public function resolve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $incident = Incident::with('asset')->findOrFail($id);

        $validated = $request->validate([
            'resolution' => 'required|string|min:5',
            'restore_asset_status' => ['nullable', Rule::in(['available', 'maintenance', 'damaged', 'retired'])],
            'asset_condition' => ['nullable', Rule::in(['excellent', 'good', 'fair', 'minor_damage', 'damaged'])],
        ]);

        $incident->update([
            'resolution' => $validated['resolution'],
            'resolved_by_id' => $user->id,
            'resolved_at' => now(),
        ]);

        if (!empty($validated['restore_asset_status'])) {
            $incident->asset->update([
                'status' => $validated['restore_asset_status'],
                'condition' => $validated['asset_condition'] ?? $incident->asset->condition,
            ]);

            $incident->asset->logHistory(
                action: 'repaired',
                notes: "Incident {$incident->incident_number} resolved. Status set to: " . strtoupper($validated['restore_asset_status']),
                userId: $user->id
            );
        }

        AuditService::log(
            action: 'incident_resolved',
            entityType: 'Incident',
            entityId: $incident->id,
            oldValues: null,
            newValues: ['resolution' => $validated['resolution'], 'resolved_by' => $user->id],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Incident marked as resolved.',
            'incident' => $incident->fresh(['asset', 'reportedBy', 'resolvedBy']),
        ]);
    }
}
