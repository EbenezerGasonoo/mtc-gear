<?php

use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GearKitController;
use App\Http\Controllers\Api\GearRequestController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReturnController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::get('/settings/branding', [SettingController::class, 'index']);
Route::get('/reports/export/{type}', [ReportController::class, 'exportCsv']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Dashboard & Notifications
    Route::get('/dashboard', [DashboardController::class, 'stats']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Assets & Inventory
    Route::get('/assets', [AssetController::class, 'index']);
    Route::get('/assets/preview-id', [AssetController::class, 'previewId']);
    Route::get('/assets/{id}', [AssetController::class, 'show']);
    
    // Asset mutations (Overseer & Admin)
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/assets', [AssetController::class, 'store']);
        Route::put('/assets/{id}', [AssetController::class, 'update']);
        Route::delete('/assets/{id}', [AssetController::class, 'destroy']);
    });

    // Categories & Locations
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/locations', [LocationController::class, 'index']);
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        Route::post('/locations', [LocationController::class, 'store']);
        Route::put('/locations/{id}', [LocationController::class, 'update']);
        Route::delete('/locations/{id}', [LocationController::class, 'destroy']);
    });

    // Gear Kits
    Route::get('/kits', [GearKitController::class, 'index']);
    Route::get('/kits/{id}', [GearKitController::class, 'show']);
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/kits', [GearKitController::class, 'store']);
        Route::put('/kits/{id}', [GearKitController::class, 'update']);
        Route::delete('/kits/{id}', [GearKitController::class, 'destroy']);
    });

    // Gear Requests & Availability
    Route::get('/requests', [GearRequestController::class, 'index']);
    Route::post('/requests', [GearRequestController::class, 'store']);
    Route::post('/requests/check-availability', [GearRequestController::class, 'checkAvailability']);
    Route::get('/requests/{id}', [GearRequestController::class, 'show']);
    Route::post('/requests/{id}/cancel', [GearRequestController::class, 'cancel']);

    // Approvals (Overseer & Admin)
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/requests/{id}/approve', [GearRequestController::class, 'approve']);
        Route::post('/requests/{id}/partially-approve', [GearRequestController::class, 'partiallyApprove']);
        Route::post('/requests/{id}/reject', [GearRequestController::class, 'reject']);
        Route::post('/requests/{id}/request-changes', [GearRequestController::class, 'requestChanges']);
    });

    // Checkouts & Inspections
    Route::get('/checkouts', [CheckoutController::class, 'index']);
    Route::get('/checkouts/{id}', [CheckoutController::class, 'show']);
    Route::post('/checkouts/{id}/acknowledge', [CheckoutController::class, 'acknowledgeHandover']);
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/checkouts', [CheckoutController::class, 'store']);
    });

    // Returns
    Route::get('/returns', [ReturnController::class, 'index']);
    Route::get('/returns/{id}', [ReturnController::class, 'show']);
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/returns', [ReturnController::class, 'store']);
    });

    // Maintenance
    Route::get('/maintenance', [MaintenanceController::class, 'index']);
    Route::get('/maintenance/{id}', [MaintenanceController::class, 'show']);
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/maintenance', [MaintenanceController::class, 'store']);
        Route::post('/maintenance/{id}/complete', [MaintenanceController::class, 'complete']);
    });

    // Incidents
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::get('/incidents/{id}', [IncidentController::class, 'show']);
    Route::middleware('role:super_admin,gear_overseer')->group(function () {
        Route::post('/incidents/{id}/resolve', [IncidentController::class, 'resolve']);
    });

    // Reports
    Route::get('/reports/inventory', [ReportController::class, 'inventory']);
    Route::get('/reports/deployment', [ReportController::class, 'deployment']);
    Route::get('/reports/overdue', [ReportController::class, 'overdue']);
    Route::get('/reports/utilization', [ReportController::class, 'utilization']);
    Route::get('/reports/staff-usage', [ReportController::class, 'staffUsage']);
    Route::get('/reports/maintenance', [ReportController::class, 'maintenance']);
    Route::get('/reports/damage', [ReportController::class, 'damage']);

    // Super Admin Exclusive: Users, Settings & Immutable Audit Trail
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update']);

        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });
});
