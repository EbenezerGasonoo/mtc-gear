<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Asset::with(['category', 'location', 'assignedUser', 'primaryPhoto']);

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('asset_id', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($condition = $request->query('condition')) {
            $query->where('condition', $condition);
        }

        if ($locationId = $request->query('location_id')) {
            $query->where('location_id', $locationId);
        }

        // Sorting
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $allowedSorts = ['name', 'asset_id', 'created_at', 'status', 'condition', 'purchase_price'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = (int) $request->query('per_page', 15);
        $assets = $query->paginate($perPage);

        return response()->json($assets);
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::findOrFail($request->category_id);

        // Determine Asset ID: either provided manual override or auto-generated
        $autoId = Asset::generateAssetId($category->code);
        $assetId = $request->filled('asset_id') ? trim($request->asset_id) : $autoId;

        $validated = $request->validate([
            'asset_id' => ['nullable', 'string', 'max:50', 'unique:assets,asset_id'],
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'serial_number' => 'required|string|max:100|unique:assets,serial_number',
            'description' => 'nullable|string',
            'condition' => ['required', Rule::in(['excellent', 'good', 'fair', 'minor_damage', 'damaged'])],
            'status' => ['required', Rule::in(['available', 'reserved', 'checked_out', 'maintenance', 'damaged', 'lost', 'retired'])],
            'location_id' => 'required|exists:locations,id',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'warranty_expiry' => 'nullable|date',
            'assigned_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|max:10240', // 10MB max
        ]);

        $validated['asset_id'] = $assetId;

        $asset = Asset::create($validated);

        // Handle Photo Upload
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('assets', 'public');
            $asset->photos()->create([
                'file_path' => $path,
                'is_primary' => true,
                'caption' => $asset->name,
            ]);
        }

        // Log History & Audit
        $asset->logHistory(
            action: 'created',
            notes: "Asset {$asset->asset_id} initialized in inventory.",
            userId: $request->user()->id
        );

        AuditService::log(
            action: 'asset_created',
            entityType: 'Asset',
            entityId: $asset->id,
            oldValues: null,
            newValues: $asset->toArray(),
            userId: $request->user()->id
        );

        return response()->json([
            'message' => 'Asset registered successfully.',
            'asset' => $asset->load(['category', 'location', 'assignedUser', 'photos']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $asset = Asset::with([
            'category',
            'location',
            'assignedUser',
            'photos',
            'documents',
            'history.user',
            'maintenanceRecords',
            'incidents.reportedBy',
            'incidents.resolvedBy',
        ])->findOrFail($id);

        return response()->json([
            'asset' => $asset,
            'qr_url' => url("/assets/{$asset->asset_id}"),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $asset = Asset::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'serial_number' => ['required', 'string', 'max:100', Rule::unique('assets', 'serial_number')->ignore($asset->id)],
            'description' => 'nullable|string',
            'condition' => ['required', Rule::in(['excellent', 'good', 'fair', 'minor_damage', 'damaged'])],
            'status' => ['required', Rule::in(['available', 'reserved', 'checked_out', 'maintenance', 'damaged', 'lost', 'retired'])],
            'location_id' => 'required|exists:locations,id',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'warranty_expiry' => 'nullable|date',
            'assigned_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|max:10240',
        ]);

        $old = $asset->only(array_keys($validated));
        $oldStatus = $asset->status;
        $oldLocation = $asset->location_id;

        $asset->update($validated);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('assets', 'public');
            $asset->photos()->update(['is_primary' => false]);
            $asset->photos()->create([
                'file_path' => $path,
                'is_primary' => true,
                'caption' => $asset->name,
            ]);
        }

        // Record specific history if status changed
        if ($oldStatus !== $asset->status) {
            $asset->logHistory(
                action: 'status_changed',
                notes: "Status modified from " . strtoupper($oldStatus) . " to " . strtoupper($asset->status) . ".",
                userId: $request->user()->id
            );
        }

        if ($oldLocation !== $asset->location_id) {
            $newLoc = Location::find($asset->location_id);
            $asset->logHistory(
                action: 'location_changed',
                notes: "Relocated to " . ($newLoc ? $newLoc->name : 'New Location') . ".",
                userId: $request->user()->id
            );
        }

        AuditService::log(
            action: 'asset_updated',
            entityType: 'Asset',
            entityId: $asset->id,
            oldValues: $old,
            newValues: $asset->only(array_keys($validated)),
            userId: $request->user()->id
        );

        return response()->json([
            'message' => 'Asset updated successfully.',
            'asset' => $asset->fresh(['category', 'location', 'assignedUser', 'photos']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $asset = Asset::findOrFail($id);
        $assetId = $asset->asset_id;

        AuditService::log(
            action: 'asset_archived',
            entityType: 'Asset',
            entityId: $asset->id,
            oldValues: $asset->toArray(),
            newValues: ['status' => 'deleted'],
            userId: $request->user()->id
        );

        $asset->delete();

        return response()->json([
            'message' => "Asset {$assetId} archived successfully.",
        ]);
    }

    public function previewId(Request $request): JsonResponse
    {
        $request->validate(['category_id' => 'required|exists:categories,id']);
        $category = Category::findOrFail($request->category_id);
        $nextId = Asset::generateAssetId($category->code);

        return response()->json(['asset_id' => $nextId]);
    }
}
