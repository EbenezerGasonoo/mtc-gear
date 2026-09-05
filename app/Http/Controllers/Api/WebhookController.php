<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Webhook;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function index(): JsonResponse
    {
        $webhooks = Webhook::orderBy('created_at', 'desc')->get();
        return response()->json($webhooks);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'service_type' => 'required|in:whatsapp,generic',
            'url' => 'required|url|max:255',
            'secret' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'events' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $webhook = Webhook::create([
            'name' => $validated['name'],
            'service_type' => $validated['service_type'],
            'url' => $validated['url'],
            'secret' => $validated['secret'] ?? null,
            'phone_number' => $validated['phone_number'] ?? null,
            'events' => $validated['events'] ?? [
                'request.created',
                'request.approved',
                'request.rejected',
                'checkout.completed',
                'return.completed',
                'incident.reported',
                'checkout.overdue',
            ],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($webhook, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $webhook = Webhook::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'service_type' => 'sometimes|required|in:whatsapp,generic',
            'url' => 'sometimes|required|url|max:255',
            'secret' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'events' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $webhook->update($validated);

        return response()->json($webhook);
    }

    public function destroy(int $id): JsonResponse
    {
        $webhook = Webhook::findOrFail($id);
        $webhook->delete();

        return response()->json(['message' => 'Webhook deleted successfully.']);
    }

    public function test(int $id): JsonResponse
    {
        $webhook = Webhook::findOrFail($id);

        $result = AlertService::sendSingleWebhook(
            $webhook,
            'test.ping',
            'Test Alert Ping',
            'This is a verified test ping from the MTC GEAR Production Alert Engine.',
            [
                'Project' => 'Documentary Film Shoot Test',
                'Triggered By' => auth()->user()->name ?? 'System Admin',
                'Service Channel' => ucfirst($webhook->service_type),
                'Destination' => $webhook->phone_number ?? $webhook->url,
            ],
            url('/')
        );

        return response()->json([
            'message' => $result['success'] ? 'Test alert dispatched successfully!' : 'Webhook endpoint returned an error response.',
            'result' => $result,
            'webhook' => $webhook->fresh(),
        ]);
    }
}
