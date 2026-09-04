<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact your administrator.'
            ], 403);
        }

        // Revoke existing tokens for a clean session
        $user->tokens()->delete();

        $token = $user->createToken('mtc_gear_auth_token')->plainTextToken;

        AuditService::log(
            action: 'user_login',
            entityType: 'User',
            entityId: $user->id,
            oldValues: null,
            newValues: ['email' => $user->email, 'role' => $user->role],
            userId: $user->id
        );

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'department' => $user->department,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            AuditService::log(
                action: 'user_logout',
                entityType: 'User',
                entityId: $user->id,
                oldValues: null,
                newValues: null,
                userId: $user->id
            );
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $unreadCount = $user->notifications()->where('is_read', false)->count();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'department' => $user->department,
                'unread_notifications_count' => $unreadCount,
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:100',
            'current_password' => 'nullable|required_with:new_password',
            'new_password' => 'nullable|min:8|confirmed',
        ]);

        if (!empty($validated['current_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password provided is incorrect.'],
                ]);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $old = $user->only(['name', 'phone', 'department']);
        $user->name = $validated['name'];
        $user->phone = $validated['phone'] ?? null;
        $user->department = $validated['department'] ?? null;
        $user->save();

        AuditService::log(
            action: 'profile_updated',
            entityType: 'User',
            entityId: $user->id,
            oldValues: $old,
            newValues: $user->only(['name', 'phone', 'department']),
            userId: $user->id
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ]);
    }
}
