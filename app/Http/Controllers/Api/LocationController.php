<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    public function index(): JsonResponse
    {
        $locations = Location::withCount('assets')->orderBy('name')->get();
        return response()->json($locations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:locations,name',
            'code' => 'required|string|max:20|unique:locations,code',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $location = Location::create($validated);

        AuditService::log('location_created', 'Location', $location->id, null, $location->toArray());

        return response()->json([
            'message' => 'Location created successfully.',
            'location' => $location,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $location = Location::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('locations', 'name')->ignore($location->id)],
            'code' => ['required', 'string', 'max:20', Rule::unique('locations', 'code')->ignore($location->id)],
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $old = $location->toArray();
        $location->update($validated);

        AuditService::log('location_updated', 'Location', $location->id, $old, $location->toArray());

        return response()->json([
            'message' => 'Location updated successfully.',
            'location' => $location,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $location = Location::withCount('assets')->findOrFail($id);

        if ($location->assets_count > 0) {
            return response()->json([
                'message' => "Cannot delete location '{$location->name}' because {$location->assets_count} assets are currently assigned to it.",
            ], 422);
        }

        AuditService::log('location_deleted', 'Location', $location->id, $location->toArray(), null);
        $location->delete();

        return response()->json(['message' => 'Location deleted successfully.']);
    }
}
