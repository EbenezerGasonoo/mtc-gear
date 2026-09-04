<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory;

    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';

    const TYPE_DAMAGE = 'damage';
    const TYPE_MISSING = 'missing';
    const TYPE_LOST = 'lost';
    const TYPE_TECHNICAL_FAULT = 'technical_fault';
    const TYPE_ACCESSORY_MISSING = 'accessory_missing';
    const TYPE_OTHER = 'other';

    protected $fillable = [
        'incident_number',
        'asset_id',
        'reported_by_id',
        'checkout_id',
        'type',
        'severity',
        'incident_date',
        'project_name',
        'description',
        'resolution',
        'resolved_by_id',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'incident_date' => 'date',
            'resolved_at' => 'datetime',
        ];
    }

    public static function generateIncidentNumber(): string
    {
        $year = date('Y');
        $prefix = "INC-{$year}-";

        $latest = self::where('incident_number', 'like', "{$prefix}%")
            ->orderBy('incident_number', 'desc')
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->incident_number);
            $num = intval(end($parts)) + 1;
        } else {
            $num = 1;
        }

        return sprintf("%s%04d", $prefix, $num);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function reportedBy()
    {
        return $this->belongsTo(User::class, 'reported_by_id');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by_id');
    }

    public function checkout()
    {
        return $this->belongsTo(Checkout::class);
    }

    public function photos()
    {
        return $this->hasMany(IncidentPhoto::class);
    }
}
