<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_AVAILABLE = 'available';
    const STATUS_RESERVED = 'reserved';
    const STATUS_CHECKED_OUT = 'checked_out';
    const STATUS_MAINTENANCE = 'maintenance';
    const STATUS_DAMAGED = 'damaged';
    const STATUS_LOST = 'lost';
    const STATUS_RETIRED = 'retired';

    const CONDITION_EXCELLENT = 'excellent';
    const CONDITION_GOOD = 'good';
    const CONDITION_FAIR = 'fair';
    const CONDITION_MINOR_DAMAGE = 'minor_damage';
    const CONDITION_DAMAGED = 'damaged';

    protected $fillable = [
        'asset_id',
        'name',
        'category_id',
        'brand',
        'model',
        'serial_number',
        'description',
        'condition',
        'status',
        'location_id',
        'purchase_date',
        'purchase_price',
        'warranty_expiry',
        'assigned_user_id',
        'notes',
        'qr_code_path',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'warranty_expiry' => 'date',
            'purchase_price' => 'decimal:2',
        ];
    }

    public function isRequestable(): bool
    {
        return !in_array($this->status, [
            self::STATUS_MAINTENANCE,
            self::STATUS_DAMAGED,
            self::STATUS_LOST,
            self::STATUS_RETIRED,
        ]);
    }

    public static function generateAssetId(string $categoryCode): string
    {
        $code = strtoupper($categoryCode);
        $prefix = "MTC-{$code}-";
        
        $latest = self::withTrashed()
            ->where('asset_id', 'like', "{$prefix}%")
            ->orderBy('asset_id', 'desc')
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->asset_id);
            $num = intval(end($parts)) + 1;
        } else {
            $num = 1;
        }

        return sprintf("%s%03d", $prefix, $num);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function photos()
    {
        return $this->hasMany(AssetPhoto::class);
    }

    public function primaryPhoto()
    {
        return $this->hasOne(AssetPhoto::class)->where('is_primary', true);
    }

    public function documents()
    {
        return $this->hasMany(AssetDocument::class);
    }

    public function history()
    {
        return $this->hasMany(AssetHistory::class)->latest();
    }

    public function checkouts()
    {
        return $this->hasMany(CheckoutItem::class);
    }

    public function maintenanceRecords()
    {
        return $this->hasMany(MaintenanceRecord::class)->latest();
    }

    public function incidents()
    {
        return $this->hasMany(Incident::class)->latest();
    }

    public function logHistory(string $action, ?string $notes = null, ?string $projectName = null, ?array $metadata = null, ?int $userId = null)
    {
        return $this->history()->create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'project_name' => $projectName,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }
}
