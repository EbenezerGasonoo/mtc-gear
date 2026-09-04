<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GearKit;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GearKitController extends Controller
{
    public function index(): JsonResponse
    {
        $kits = GearKit::with(['category', 'items.asset.category', 'items.asset.location'])
            ->latest()
            ->get();

        return response()->json($kits);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:30|unique:gear_kits,code',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.asset_id' => 'required|exists:assets,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.is_required' => 'boolean',
        ]);

        $kit = GearKit::create([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        foreach ($validated['items'] as $item) {
            $kit->items()->create([
                'asset_id' => $item['asset_id'],
                'quantity' => $item['quantity'] ?? 1,
                'is_required' => $item['is_required'] ?? true,
            ]);
        }

        AuditService::log('gear_kit_created', 'GearKit', $kit->id, null, $kit->load('items')->toArray());

        return response()->json([
            'message' => 'Gear Kit created successfully.',
            'kit' => $kit->load(['category', 'items.asset']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $kit = GearKit::with(['category', 'items.asset.category', 'items.asset.location'])->findOrFail($id);
        return response()->json($kit);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $kit = GearKit::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:30', Rule::unique('gear_kits', 'code')->ignore($kit->id)],
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'items' => 'nullable|array',
            'items.*.asset_id' => 'required|exists:assets,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.is_required' => 'boolean',
        ]);

        $old = $kit->load('items')->toArray();

        $kit->update([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['items'])) {
            $kit->items()->delete();
            foreach ($validated['items'] as $item) {
                $kit->items()->create([
                    'asset_id' => $item['asset_id'],
                    'quantity' => $item['quantity'] ?? 1,
                    'is_required' => $item['is_required'] ?? true,
                ]);
            }
        }

        AuditService::log('gear_kit_updated', 'GearKit', $kit->id, $old, $kit->load('items')->toArray());

        return response()->json([
            'message' => 'Gear Kit updated successfully.',
            'kit' => $kit->load(['category', 'items.asset']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $kit = GearKit::findOrFail($id);
        AuditService::log('gear_kit_deleted', 'GearKit', $kit->id, $kit->toArray(), null);
        $kit->delete();

        return response()->json(['message' => 'Gear Kit deleted successfully.']);
    }
}
