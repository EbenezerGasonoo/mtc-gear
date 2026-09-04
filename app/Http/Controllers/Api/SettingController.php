<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'branding_app_name' => Setting::get('branding_app_name', 'MTC GEAR'),
            'branding_subtitle' => Setting::get('branding_subtitle', 'Equipment Inventory & Deployment Management'),
            'branding_organization' => Setting::get('branding_organization', 'Mountain Top Communications'),
            'branding_primary_color' => Setting::get('branding_primary_color', '#D97706'),
            'branding_currency' => Setting::get('branding_currency', 'USD'),
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::set($key, $value);
        }

        AuditService::log('settings_updated', 'Setting', null, null, $validated['settings']);

        return response()->json([
            'message' => 'Settings saved successfully.',
        ]);
    }
}
