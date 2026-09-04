<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Checkout;
use App\Models\GearRequest;
use App\Models\Incident;
use App\Models\Location;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MtcGearSystemTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $overseer;
    protected User $staff;
    protected Category $cameraCat;
    protected Location $hqLocation;
    protected Asset $cameraAsset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@mtc.local',
            'password' => Hash::make('Password123!'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->overseer = User::create([
            'name' => 'Overseer User',
            'email' => 'overseer@mtc.local',
            'password' => Hash::make('Password123!'),
            'role' => 'gear_overseer',
            'status' => 'active',
        ]);

        $this->staff = User::create([
            'name' => 'Staff Member',
            'email' => 'staff@mtc.local',
            'password' => Hash::make('Password123!'),
            'role' => 'staff',
            'status' => 'active',
        ]);

        $this->cameraCat = Category::create([
            'name' => 'Cameras',
            'code' => 'CAM',
            'description' => 'Cinema and production cameras',
        ]);

        $this->hqLocation = Location::create([
            'name' => 'MTC Headquarters',
            'code' => 'HQ-ACCRA',
            'address' => 'Ridge, Accra',
        ]);

        $this->cameraAsset = Asset::create([
            'asset_id' => 'MTC-CAM-001',
            'name' => 'Sony FX6 Cinema Camera',
            'category_id' => $this->cameraCat->id,
            'brand' => 'Sony',
            'model' => 'FX6',
            'serial_number' => 'TEST-SERIAL-001',
            'condition' => 'excellent',
            'status' => 'available',
            'location_id' => $this->hqLocation->id,
            'purchase_price' => 5998.00,
        ]);
    }

    public function test_user_authentication_and_token_issuance(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'staff@mtc.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'user_login',
            'user_id' => $this->staff->id,
        ]);
    }

    public function test_role_based_authorization_restrictions(): void
    {
        // Staff cannot view users list (Super Admin only)
        $response = $this->actingAs($this->staff)->getJson('/api/users');
        $response->assertStatus(403);

        // Staff cannot view audit logs (Super Admin only)
        $response = $this->actingAs($this->staff)->getJson('/api/audit-logs');
        $response->assertStatus(403);

        // Super Admin can view users list
        $response = $this->actingAs($this->admin)->getJson('/api/users');
        $response->assertStatus(200);
    }

    public function test_asset_registration_and_automatic_id_generation(): void
    {
        // Registering a second camera should auto-generate MTC-CAM-002
        $response = $this->actingAs($this->overseer)->postJson('/api/assets', [
            'name' => 'Sony FX30',
            'category_id' => $this->cameraCat->id,
            'brand' => 'Sony',
            'model' => 'FX30',
            'serial_number' => 'TEST-SERIAL-002',
            'condition' => 'excellent',
            'status' => 'available',
            'location_id' => $this->hqLocation->id,
        ]);

        $response->assertStatus(201);
        $this->assertEquals('MTC-CAM-002', $response->json('asset.asset_id'));

        $this->assertDatabaseHas('assets', [
            'asset_id' => 'MTC-CAM-002',
            'name' => 'Sony FX30',
        ]);
    }

    public function test_realtime_date_collision_and_availability_service(): void
    {
        $start = Carbon::now()->addDays(5)->toDateString();
        $end = Carbon::now()->addDays(8)->toDateString();

        // 1. Check initially available
        $check1 = AvailabilityService::checkAsset($this->cameraAsset->id, $start, $end);
        $this->assertTrue($check1['is_available']);

        // 2. Create an approved request overlapping these dates
        $req = GearRequest::create([
            'request_number' => 'REQ-2026-TEST',
            'user_id' => $this->staff->id,
            'project_name' => 'Docu Series',
            'purpose' => 'Filming',
            'destination_location' => 'Accra',
            'start_date' => $start,
            'expected_return_date' => $end,
            'status' => GearRequest::STATUS_APPROVED,
        ]);
        $req->items()->create([
            'asset_id' => $this->cameraAsset->id,
            'status' => 'approved',
        ]);

        // 3. Collision check: another booking requesting dates inside [start, end]
        $check2 = AvailabilityService::checkAsset(
            $this->cameraAsset->id,
            Carbon::parse($start)->addDay()->toDateString(),
            Carbon::parse($end)->addDays(2)->toDateString()
        );

        $this->assertFalse($check2['is_available']);
        $this->assertStringContainsString('Docu Series', $check2['reason']);
    }

    public function test_complete_end_to_end_lifecycle_workflow(): void
    {
        $startDate = Carbon::now()->addDays(1)->toDateString();
        $returnDate = Carbon::now()->addDays(3)->toDateString();

        // Step 1: Staff submits gear request
        $createReqResponse = $this->actingAs($this->staff)->postJson('/api/requests', [
            'project_name' => 'African Heritage Doc',
            'purpose' => 'Historical filming',
            'destination_location' => 'Cape Coast',
            'start_date' => $startDate,
            'expected_return_date' => $returnDate,
            'asset_ids' => [$this->cameraAsset->id],
        ]);
        $createReqResponse->assertStatus(201);
        $requestId = $createReqResponse->json('request.id');

        // Step 2: Overseer approves request
        $approveResponse = $this->actingAs($this->overseer)->postJson("/api/requests/{$requestId}/approve");
        $approveResponse->assertStatus(200);
        $this->assertEquals('approved', $approveResponse->json('request.status'));

        // Step 3: Overseer performs pre-checkout inspection & handover
        $checkoutResponse = $this->actingAs($this->overseer)->postJson('/api/checkouts', [
            'gear_request_id' => $requestId,
            'notes' => 'Checked sensor and lens mount.',
            'items' => [
                [
                    'asset_id' => $this->cameraAsset->id,
                    'condition' => 'excellent',
                    'accessories_included' => ['battery', 'charger', 'memory_card'],
                    'notes' => 'Battery fully charged.',
                ]
            ]
        ]);
        $checkoutResponse->assertStatus(201);
        $checkoutId = $checkoutResponse->json('checkout.id');

        // Verify asset is now CHECKED_OUT
        $this->cameraAsset->refresh();
        $this->assertEquals(Asset::STATUS_CHECKED_OUT, $this->cameraAsset->status);
        $this->assertEquals($this->staff->id, $this->cameraAsset->assigned_user_id);

        // Step 4: Borrower signs digital handover
        $signResponse = $this->actingAs($this->staff)->postJson("/api/checkouts/{$checkoutId}/acknowledge", [
            'acknowledgment_text' => 'I confirm that I have received this equipment and acknowledge responsibility for its safe use and return.',
        ]);
        $signResponse->assertStatus(200);

        $checkout = Checkout::find($checkoutId);
        $this->assertNotNull($checkout->handover_signed_at);
        $this->assertNotNull($checkout->digital_signature_hash);

        // Step 5: Equipment return with damage flagged -> triggers automatic incident
        $returnResponse = $this->actingAs($this->overseer)->postJson('/api/returns', [
            'checkout_id' => $checkoutId,
            'notes' => 'Returned with cracked LCD screen.',
            'items' => [
                [
                    'asset_id' => $this->cameraAsset->id,
                    'condition' => 'damaged',
                    'is_damaged' => true,
                    'is_missing' => false,
                    'requires_maintenance' => true,
                    'notes' => 'Cracked LCD hinge during field shoot.',
                ]
            ]
        ]);
        $returnResponse->assertStatus(201);

        // Verify asset transitioned to DAMAGED
        $this->cameraAsset->refresh();
        $this->assertEquals(Asset::STATUS_DAMAGED, $this->cameraAsset->status);
        $this->assertNull($this->cameraAsset->assigned_user_id);

        // Verify automated incident ticket was created
        $this->assertDatabaseHas('incidents', [
            'asset_id' => $this->cameraAsset->id,
            'type' => 'damage',
        ]);

        $incident = Incident::where('asset_id', $this->cameraAsset->id)->first();
        $this->assertNotNull($incident);
        $this->assertStringStartsWith('INC-', $incident->incident_number);

        // Verify history entries exist
        $this->assertDatabaseHas('asset_history', [
            'asset_id' => $this->cameraAsset->id,
            'action' => 'checked_out',
        ]);
        $this->assertDatabaseHas('asset_history', [
            'asset_id' => $this->cameraAsset->id,
            'action' => 'returned',
        ]);
    }

    public function test_overdue_scan_command(): void
    {
        // Create past checkout
        $pastDate = Carbon::now()->subDays(2);
        $req = GearRequest::create([
            'request_number' => 'REQ-OVERDUE-01',
            'user_id' => $this->staff->id,
            'project_name' => 'Expired Shoot',
            'purpose' => 'Test',
            'destination_location' => 'Kumasi',
            'start_date' => Carbon::now()->subDays(5)->toDateString(),
            'expected_return_date' => $pastDate->toDateString(),
            'status' => GearRequest::STATUS_CHECKED_OUT,
        ]);

        $checkout = Checkout::create([
            'gear_request_id' => $req->id,
            'user_id' => $this->staff->id,
            'inspector_id' => $this->overseer->id,
            'checkout_date' => Carbon::now()->subDays(5),
            'expected_return_date' => $pastDate,
            'status' => Checkout::STATUS_CHECKED_OUT,
        ]);

        Artisan::call('gear:check-overdue');

        $checkout->refresh();
        $this->assertEquals(Checkout::STATUS_OVERDUE, $checkout->status);
    }
}
