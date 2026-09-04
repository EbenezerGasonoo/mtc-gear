<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(20);
        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role' => ['required', Rule::in(['super_admin', 'gear_overseer', 'staff', 'viewer'])],
            'phone' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:100',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'department' => $validated['department'] ?? null,
            'status' => $validated['status'],
        ]);

        AuditService::log('user_created', 'User', $user->id, null, $user->only(['name', 'email', 'role', 'department', 'status']));

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::withCount(['requests', 'checkouts'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|min:8',
            'role' => ['required', Rule::in(['super_admin', 'gear_overseer', 'staff', 'viewer'])],
            'phone' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:100',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $old = $user->only(['name', 'email', 'role', 'phone', 'department', 'status']);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->phone = $validated['phone'] ?? null;
        $user->department = $validated['department'] ?? null;
        $user->status = $validated['status'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        AuditService::log('user_updated', 'User', $user->id, $old, $user->only(['name', 'email', 'role', 'phone', 'department', 'status']));

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        AuditService::log('user_deleted', 'User', $user->id, $user->toArray(), null);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
