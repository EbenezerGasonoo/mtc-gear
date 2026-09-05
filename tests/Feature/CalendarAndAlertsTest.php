<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Category;
use App\Models\GearRequest;
use App\Models\GearRequestItem;
use App\Models\Location;
use App\Models\User;
use App\Models\Webhook;
use App\Services\AlertService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CalendarAndAlertsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $crew;
    protected Category $category;
    protected Location $location;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@test.org',
            'role' => 'super_admin',
        ]);

        $this->crew = User::factory()->create([
            'email' => 'crew@test.org',
            'role' => 'staff',
        ]);

        $this->category = Category::create([
            'name' => 'Cinema Cameras',
            'code' => 'CAM',
        ]);

        $this->location = Location::create([
            'name' => 'Locker A',
            'code' => 'LCK-A',
        ]);
    }

    public function test_calendar_timeline_returns_assets_and_bookings(): void
    {
        $asset = Asset::create([
            'asset_id' => 'MTC-CAM-100',
            'name' => 'Sony FX6 Cinema Line',
            'brand' => 'Sony',
            'model' => 'FX6',
            'serial_number' => 'SN-100200',
            'category_id' => $this->category->id,
            'location_id' => $this->location->id,
            'status' => 'available',
        ]);

        $req = GearRequest::create([
            'request_number' => 'REQ-2026-999',
            'user_id' => $this->crew->id,
            'project_name' => 'Faith & Film Shoot',
            'purpose' => 'Commercial Documentary',
            'destination_location' => 'Accra Studio',
            'start_date' => now()->addDays(2)->toDateString(),
            'expected_return_date' => now()->addDays(5)->toDateString(),
            'status' => 'approved',
        ]);

        GearRequestItem::create([
            'gear_request_id' => $req->id,
            'asset_id' => $asset->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/calendar/timeline');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'date_range' => ['start_date', 'end_date'],
            'stats' => ['total_assets', 'active_deployments', 'upcoming_bookings', 'detected_conflicts'],
            'timeline',
        ]);

        $timeline = $response->json('timeline');
        $this->assertNotEmpty($timeline);
        $this->assertEquals('Sony FX6 Cinema Line', $timeline[0]['name']);
        $this->assertCount(1, $timeline[0]['bookings']);
        $this->assertEquals('Faith & Film Shoot', $timeline[0]['bookings'][0]['project_name']);
    }

    public function test_calendar_conflicts_detection(): void
    {
        $asset = Asset::create([
            'asset_id' => 'MTC-CAM-101',
            'name' => 'RED Komodo 6K',
            'brand' => 'RED',
            'model' => 'Komodo',
            'serial_number' => 'SN-300400',
            'category_id' => $this->category->id,
            'location_id' => $this->location->id,
            'status' => 'available',
        ]);

        // Request 1: Days 2-6
        $req1 = GearRequest::create([
            'request_number' => 'REQ-2026-801',
            'user_id' => $this->crew->id,
            'project_name' => 'Youth Rally Promo',
            'purpose' => 'Video production',
            'destination_location' => 'Main Auditorium',
            'start_date' => now()->addDays(2)->toDateString(),
            'expected_return_date' => now()->addDays(6)->toDateString(),
            'status' => 'approved',
        ]);

        GearRequestItem::create([
            'gear_request_id' => $req1->id,
            'asset_id' => $asset->id,
            'status' => 'approved',
        ]);

        // Request 2: Overlapping Days 4-8 on identical asset
        $req2 = GearRequest::create([
            'request_number' => 'REQ-2026-802',
            'user_id' => $this->crew->id,
            'project_name' => 'Sunday Service Broadcast',
            'purpose' => 'Live stream coverage',
            'destination_location' => 'Sanctuary',
            'start_date' => now()->addDays(4)->toDateString(),
            'expected_return_date' => now()->addDays(8)->toDateString(),
            'status' => 'approved',
        ]);

        GearRequestItem::create([
            'gear_request_id' => $req2->id,
            'asset_id' => $asset->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/calendar/conflicts');

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $response->json('count'));
        $conflicts = $response->json('conflicts');
        $this->assertEquals('Youth Rally Promo', $conflicts[0]['request_1']['project_name']);
        $this->assertEquals('Sunday Service Broadcast', $conflicts[0]['request_2']['project_name']);
        $this->assertEquals('RED Komodo 6K', $conflicts[0]['shared_equipment'][0]['name']);
    }

    public function test_webhook_crud_and_test_ping(): void
    {
        Http::fake([
            'https://webhook.site/*' => Http::response(['status' => 'delivered'], 200),
        ]);

        // 1. Create Webhook
        $createRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/webhooks', [
                'name' => 'WhatsApp Production Alerts',
                'service_type' => 'whatsapp',
                'url' => 'https://webhook.site/test-endpoint',
                'phone_number' => '+233201234567',
                'events' => ['request.created', 'checkout.completed'],
                'is_active' => true,
            ]);

        $createRes->assertStatus(201);
        $webhookId = $createRes->json('id');

        // 2. Test Webhook Ping
        $testRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/webhooks/{$webhookId}/test");

        $testRes->assertStatus(200);
        $testRes->assertJsonFragment([
            'message' => 'Test alert dispatched successfully!',
        ]);

        $webhook = Webhook::find($webhookId);
        $this->assertEquals(200, $webhook->last_status_code);
        $this->assertNotNull($webhook->last_triggered_at);

        // 3. Delete Webhook
        $delRes = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/webhooks/{$webhookId}");

        $delRes->assertStatus(200);
        $this->assertNull(Webhook::find($webhookId));
    }
}
