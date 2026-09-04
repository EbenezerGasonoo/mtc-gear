<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('assets')->orderBy('name')->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name',
            'code' => 'required|string|max:10|unique:categories,code',
            'description' => 'nullable|string',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $category = Category::create($validated);

        AuditService::log('category_created', 'Category', $category->id, null, $category->toArray());

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('categories', 'name')->ignore($category->id)],
            'code' => ['required', 'string', 'max:10', Rule::unique('categories', 'code')->ignore($category->id)],
            'description' => 'nullable|string',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $old = $category->toArray();
        $category->update($validated);

        AuditService::log('category_updated', 'Category', $category->id, $old, $category->toArray());

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::withCount('assets')->findOrFail($id);

        if ($category->assets_count > 0) {
            return response()->json([
                'message' => "Cannot delete category '{$category->name}' because {$category->assets_count} assets belong to it.",
            ], 422);
        }

        AuditService::log('category_deleted', 'Category', $category->id, $category->toArray(), null);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
