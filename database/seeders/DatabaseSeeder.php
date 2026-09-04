<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Category;
use App\Models\GearKit;
use App\Models\Location;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@mtc.local'],
            [
                'name' => 'Kojo Mensah (Super Admin)',
                'password' => Hash::make('Password123!'),
                'role' => 'super_admin',
                'phone' => '+233 24 100 0001',
                'department' => 'Executive & IT Operations',
                'status' => 'active',
            ]
        );

        $overseer = User::firstOrCreate(
            ['email' => 'overseer@mtc.local'],
            [
                'name' => 'Ebenezer Gasonoo (Gear Overseer)',
                'password' => Hash::make('Password123!'),
                'role' => 'gear_overseer',
                'phone' => '+233 24 100 0002',
                'department' => 'Production Logistics & Gear Room',
                'status' => 'active',
            ]
        );

        $staff = User::firstOrCreate(
            ['email' => 'staff@mtc.local'],
            [
                'name' => 'David Osei (Director of Photography)',
                'password' => Hash::make('Password123!'),
                'role' => 'staff',
                'phone' => '+233 24 100 0003',
                'department' => 'Cinematography & Field Crew',
                'status' => 'active',
            ]
        );

        $viewer = User::firstOrCreate(
            ['email' => 'viewer@mtc.local'],
            [
                'name' => 'Ama Serwaa (Production Coordinator)',
                'password' => Hash::make('Password123!'),
                'role' => 'viewer',
                'phone' => '+233 24 100 0004',
                'department' => 'Project Management & Audit',
                'status' => 'active',
            ]
        );

        // 2. Seed Categories
        $categoriesData = [
            ['name' => 'Cameras', 'code' => 'CAM', 'description' => 'Cinema, mirrorless, broadcast, and specialty cameras'],
            ['name' => 'Lenses', 'code' => 'LEN', 'description' => 'Prime, zoom, cinema, and anamorphic lenses'],
            ['name' => 'Audio', 'code' => 'AUD', 'description' => 'Microphones, wireless kits, mixers, and recorders'],
            ['name' => 'Lighting', 'code' => 'LGT', 'description' => 'Continuous video lights, LED panels, and light modifiers'],
            ['name' => 'Stabilization', 'code' => 'STB', 'description' => 'Gimbals, rigs, sliders, and vest stabilizers'],
            ['name' => 'Drones', 'code' => 'DRN', 'description' => 'Aerial cinematography drones and accessories'],
            ['name' => 'Tripods', 'code' => 'TRP', 'description' => 'Fluid head tripods, monopods, and hi-hats'],
            ['name' => 'Memory Cards', 'code' => 'MEM', 'description' => 'CFexpress, SD cards, and external SSDs'],
            ['name' => 'Batteries', 'code' => 'BAT', 'description' => 'V-Mount, Gold Mount, NP-F, and OEM camera batteries'],
            ['name' => 'Chargers', 'code' => 'CHG', 'description' => 'Multi-bay and fast charging stations'],
            ['name' => 'Power', 'code' => 'PWR', 'description' => 'Generators, power stations, and AC power distribution'],
            ['name' => 'Teleprompters', 'code' => 'TEL', 'description' => 'Studio and field teleprompter rigs'],
            ['name' => 'Monitoring', 'code' => 'MON', 'description' => 'On-camera and client wireless director monitors'],
            ['name' => 'Production Accessories', 'code' => 'ACC', 'description' => 'Matte boxes, follow focus, cages, cables, and adapters'],
            ['name' => 'Other', 'code' => 'OTH', 'description' => 'Miscellaneous studio and grip equipment'],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['code']] = Category::firstOrCreate(['code' => $c['code']], $c);
        }

        // 3. Seed Locations
        $locationsData = [
            ['name' => 'MTC Headquarters (Studio A)', 'code' => 'HQ-ACCRA', 'address' => 'Independence Avenue, Ridge, Accra, Ghana', 'description' => 'Central Equipment Vault & Studio Facility'],
            ['name' => 'MTC Field Production Unit 1', 'code' => 'FIELD-01', 'address' => 'Mobile Production Van', 'description' => 'Dedicated Outside Broadcast & Field Documentary Fleet'],
            ['name' => 'MTC Post-Production & QC Lab', 'code' => 'POST-LAB', 'address' => 'Level 2, Media House, Accra', 'description' => 'Maintenance, Calibration & Ingestion Lab'],
        ];

        $locations = [];
        foreach ($locationsData as $loc) {
            $locations[$loc['code']] = Location::firstOrCreate(['code' => $loc['code']], $loc);
        }

        $hq = $locations['HQ-ACCRA'];

        // 4. Seed Real MTC Equipment
        $assetsData = [
            [
                'asset_id' => 'MTC-CAM-001',
                'name' => 'Sony FX6 Cinema Camera',
                'category_id' => $categories['CAM']->id,
                'brand' => 'Sony',
                'model' => 'ILME-FX6V',
                'serial_number' => 'TEST-SERIAL-001',
                'description' => 'Full-frame 4K cinema line camera with electronic variable ND filter, dual base ISO 800/12800, and 16-bit RAW output.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-03-15',
                'purchase_price' => 5998.00,
                'warranty_expiry' => '2027-03-15',
                'notes' => 'Primary documentary workhorse camera. Includes top handle and LCD monitor.',
            ],
            [
                'asset_id' => 'MTC-CAM-002',
                'name' => 'Sony FX30 Cinema Line Camera',
                'category_id' => $categories['CAM']->id,
                'brand' => 'Sony',
                'model' => 'ILME-FX30',
                'serial_number' => 'TEST-SERIAL-002',
                'description' => 'Super35 compact cinema camera with XLR audio handle, 4K 120p, and S-Cinetone color profile.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-05-10',
                'purchase_price' => 2198.00,
                'warranty_expiry' => '2027-05-10',
                'notes' => 'Ideal B-cam or lightweight gimbal rig setup.',
            ],
            [
                'asset_id' => 'MTC-LEN-001',
                'name' => 'Sony FE 24-70mm f/2.8 GM II Lens',
                'category_id' => $categories['LEN']->id,
                'brand' => 'Sony',
                'model' => 'SEL2470GM2',
                'serial_number' => 'TEST-SERIAL-003',
                'description' => 'Standard G Master zoom lens with exceptional sharpness and fast XD linear motor autofocus.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-04-02',
                'purchase_price' => 2298.00,
                'warranty_expiry' => '2027-04-02',
                'notes' => 'Lens hood and front/rear caps verified.',
            ],
            [
                'asset_id' => 'MTC-LEN-002',
                'name' => 'Sony FE 70-200mm f/2.8 GM OSS II Lens',
                'category_id' => $categories['LEN']->id,
                'brand' => 'Sony',
                'model' => 'SEL70200GM2',
                'serial_number' => 'TEST-SERIAL-004',
                'description' => 'Telephoto zoom lens with optical SteadyShot and tripod collar.',
                'condition' => 'good',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-04-02',
                'purchase_price' => 2798.00,
                'warranty_expiry' => '2027-04-02',
                'notes' => 'Minor scuff on tripod mount foot; glass is pristine.',
            ],
            [
                'asset_id' => 'MTC-AUD-001',
                'name' => 'DJI Mic 2 Wireless System (2 TX + 1 RX)',
                'category_id' => $categories['AUD']->id,
                'brand' => 'DJI',
                'model' => 'Mic 2',
                'serial_number' => 'TEST-SERIAL-005',
                'description' => '32-bit float onboard recording dual transmitter wireless kit with charging case and intelligent noise cancelling.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-06-20',
                'purchase_price' => 349.00,
                'warranty_expiry' => '2026-06-20',
                'notes' => 'Complete kit with magnetic clips and windscreen deadcats.',
            ],
            [
                'asset_id' => 'MTC-AUD-002',
                'name' => 'RØDE Wireless PRO Dual Channel Kit',
                'category_id' => $categories['AUD']->id,
                'brand' => 'RØDE',
                'model' => 'WIPRO',
                'serial_number' => 'TEST-SERIAL-006',
                'description' => 'Dual channel wireless microphone system with timecode generator and 32-bit float onboard backup.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-07-11',
                'purchase_price' => 399.00,
                'warranty_expiry' => '2026-07-11',
                'notes' => 'Includes 2x Lavalier II microphones.',
            ],
            [
                'asset_id' => 'MTC-AUD-003',
                'name' => 'RØDECaster Pro II Audio Production Studio',
                'category_id' => $categories['AUD']->id,
                'brand' => 'RØDE',
                'model' => 'RCP-II',
                'serial_number' => 'TEST-SERIAL-007',
                'description' => 'Integrated audio production console with 4 combo XLR preamps, SMART pads, and multitrack recording.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-02-18',
                'purchase_price' => 699.00,
                'warranty_expiry' => '2027-02-18',
                'notes' => 'Podcast and live broadcasting hub.',
            ],
            [
                'asset_id' => 'MTC-STB-001',
                'name' => 'DJI RS 3 Mini Gimbal Stabilizer',
                'category_id' => $categories['STB']->id,
                'brand' => 'DJI',
                'model' => 'RS 3 Mini',
                'serial_number' => 'TEST-SERIAL-008',
                'description' => 'Ultra-compact 3-axis handheld gimbal with native vertical shooting for mirrorless setups.',
                'condition' => 'good',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-08-01',
                'purchase_price' => 369.00,
                'warranty_expiry' => '2026-08-01',
                'notes' => 'Quick release plate and mini tripod base included.',
            ],
            [
                'asset_id' => 'MTC-STB-002',
                'name' => 'DJI RS 3 Pro Gimbal Combo',
                'category_id' => $categories['STB']->id,
                'brand' => 'DJI',
                'model' => 'RS 3 Pro',
                'serial_number' => 'TEST-SERIAL-009',
                'description' => 'Heavy-duty carbon fiber gimbal with automated axis locks and 4.5kg payload support.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-05-14',
                'purchase_price' => 1099.00,
                'warranty_expiry' => '2027-05-14',
                'notes' => 'Includes LiDAR range finder and focus motor kit.',
            ],
            [
                'asset_id' => 'MTC-DRN-001',
                'name' => 'DJI Mini 4 Pro Fly More Combo Plus',
                'category_id' => $categories['DRN']->id,
                'brand' => 'DJI',
                'model' => 'Mini 4 Pro',
                'serial_number' => 'TEST-SERIAL-010',
                'description' => 'Sub-249g 4K/60fps HDR camera drone with omnidirectional obstacle sensing and DJI RC 2 remote.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-09-01',
                'purchase_price' => 1159.00,
                'warranty_expiry' => '2026-09-01',
                'notes' => 'Contains 3 flight batteries and shoulder carry bag.',
            ],
            [
                'asset_id' => 'MTC-LGT-001',
                'name' => 'Aputure Light Storm C300d Mark II',
                'category_id' => $categories['LGT']->id,
                'brand' => 'Aputure',
                'model' => 'LS C300d II',
                'serial_number' => 'TEST-SERIAL-011',
                'description' => '5500K daylight-balanced point-source LED fixture with wireless remote control and reflector.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-01-20',
                'purchase_price' => 999.00,
                'warranty_expiry' => '2027-01-20',
                'notes' => 'Main key light with control box and clamp.',
            ],
            [
                'asset_id' => 'MTC-LGT-002',
                'name' => 'Amaran 200x Bi-Color LED Monolight',
                'category_id' => $categories['LGT']->id,
                'brand' => 'Amaran',
                'model' => 'Amaran 200x',
                'serial_number' => 'TEST-SERIAL-012',
                'description' => '200W bi-color LED video light with 2700K-6500K CCT range and Sidus Link app control.',
                'condition' => 'good',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-03-10',
                'purchase_price' => 349.00,
                'warranty_expiry' => '2026-03-10',
                'notes' => 'Ideal interview fill or hair light.',
            ],
            [
                'asset_id' => 'MTC-TRP-001',
                'name' => 'Manfrotto 504X Fluid Video Head & 645 Fast Tripod',
                'category_id' => $categories['TRP']->id,
                'brand' => 'Manfrotto',
                'model' => 'MVK504XTWINFA',
                'serial_number' => 'TEST-SERIAL-013',
                'description' => 'Carbon fiber twin-leg video tripod system with 4-step counterbalance system up to 12kg.',
                'condition' => 'good',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-02-12',
                'purchase_price' => 1250.00,
                'warranty_expiry' => '2028-02-12',
                'notes' => 'Smooth pan and tilt drag; includes mid-level spreader and rubber feet.',
            ],
            [
                'asset_id' => 'MTC-TEL-001',
                'name' => 'Desview T3 Professional Teleprompter',
                'category_id' => $categories['TEL']->id,
                'brand' => 'Desview',
                'model' => 'T3',
                'serial_number' => 'TEST-SERIAL-014',
                'description' => 'Beam-splitter glass teleprompter for tablets and smartphones with Bluetooth prompt remote controller.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-06-05',
                'purchase_price' => 189.00,
                'warranty_expiry' => '2026-06-05',
                'notes' => 'Complete lens adapter ring set (49mm to 82mm) included.',
            ],
            [
                'asset_id' => 'MTC-MON-001',
                'name' => 'FeelWorld LUT7 7-Inch 2200nit Daylight Field Monitor',
                'category_id' => $categories['MON']->id,
                'brand' => 'FeelWorld',
                'model' => 'LUT7',
                'serial_number' => 'TEST-SERIAL-015',
                'description' => 'Ultra-bright 2200nit IPS touch screen monitor with 3D LUT support, waveform, and vector scope.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-07-22',
                'purchase_price' => 269.00,
                'warranty_expiry' => '2026-07-22',
                'notes' => 'Includes tilt arm mount and micro-HDMI cable.',
            ],
            [
                'asset_id' => 'MTC-MEM-001',
                'name' => 'SanDisk Extreme PRO 128GB UHS-II V90 SDXC Card',
                'category_id' => $categories['MEM']->id,
                'brand' => 'SanDisk',
                'model' => 'SDSDXDK-128G',
                'serial_number' => 'TEST-SERIAL-016',
                'description' => 'High speed 300MB/s read and 260MB/s write SDXC card rated for continuous cinema 4K recording.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-03-15',
                'purchase_price' => 149.00,
                'warranty_expiry' => '2030-03-15',
                'notes' => 'Kept in shockproof protective case.',
            ],
            [
                'asset_id' => 'MTC-BAT-001',
                'name' => 'Sony BP-U60 Lithium-Ion Battery Pack',
                'category_id' => $categories['BAT']->id,
                'brand' => 'Sony',
                'model' => 'BP-U60',
                'serial_number' => 'TEST-SERIAL-017',
                'description' => '56Wh high capacity battery pack for Sony FX6 / FX9 cinema cameras with remaining run-time display.',
                'condition' => 'good',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-03-15',
                'purchase_price' => 289.00,
                'warranty_expiry' => '2026-03-15',
                'notes' => 'Health tested at 94% full capacity.',
            ],
            [
                'asset_id' => 'MTC-CHG-001',
                'name' => 'Dual Channel Fast Battery Charger for BP-U',
                'category_id' => $categories['CHG']->id,
                'brand' => 'Sony',
                'model' => 'BC-U2A',
                'serial_number' => 'TEST-SERIAL-018',
                'description' => 'Two-channel simultaneous battery charger with DC 12V output.',
                'condition' => 'excellent',
                'status' => 'available',
                'location_id' => $hq->id,
                'purchase_date' => '2025-03-15',
                'purchase_price' => 319.00,
                'warranty_expiry' => '2027-03-15',
                'notes' => 'Heavy duty AC power cord attached.',
            ],
        ];

        $createdAssets = [];
        foreach ($assetsData as $a) {
            $createdAssets[$a['asset_id']] = Asset::firstOrCreate(['asset_id' => $a['asset_id']], $a);
            
            // Log creation in asset history
            $createdAssets[$a['asset_id']]->logHistory(
                action: 'created',
                notes: 'Asset registered in MTC Gear vault inventory.',
                userId: $admin->id
            );
        }

        // 5. Seed Pre-configured Gear Kit: "Documentary Production Kit"
        $docKit = GearKit::firstOrCreate(
            ['code' => 'KIT-DOC-001'],
            [
                'name' => 'Documentary Production Kit',
                'description' => 'Turnkey solo shooter / documentary field package with Sony FX6, 24-70mm G Master lens, DJI wireless audio, and fluid tripod.',
                'category_id' => $categories['CAM']->id,
                'is_active' => true,
            ]
        );

        $kitItems = [
            $createdAssets['MTC-CAM-001']->id,
            $createdAssets['MTC-LEN-001']->id,
            $createdAssets['MTC-AUD-001']->id,
            $createdAssets['MTC-TRP-001']->id,
            $createdAssets['MTC-BAT-001']->id,
            $createdAssets['MTC-MEM-001']->id,
        ];

        foreach ($kitItems as $assetId) {
            $docKit->items()->firstOrCreate([
                'asset_id' => $assetId,
            ], [
                'quantity' => 1,
                'is_required' => true,
            ]);
        }

        // 6. Central Branding Settings
        Setting::set('branding_app_name', 'MTC GEAR', 'branding');
        Setting::set('branding_subtitle', 'Equipment Inventory & Deployment Management', 'branding');
        Setting::set('branding_organization', 'Mountain Top Communications', 'branding');
        Setting::set('branding_primary_color', '#386642', 'branding');
        Setting::set('branding_currency', 'USD', 'general');
    }
}
