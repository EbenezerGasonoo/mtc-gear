<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GearRequest extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_APPROVED = 'approved';
    const STATUS_PARTIALLY_APPROVED = 'partially_approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_CHECKED_OUT = 'checked_out';
    const STATUS_RETURNED = 'returned';
    const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'request_number',
        'user_id',
        'project_name',
        'purpose',
        'destination_location',
        'start_date',
        'start_time',
        'expected_return_date',
        'expected_return_time',
        'status',
        'notes',
        'rejection_reason',
        'change_request_notes',
        'admin_override_reason',
        'approved_by_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'expected_return_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public static function generateRequestNumber(): string
    {
        $year = date('Y');
        $prefix = "REQ-{$year}-";

        $latest = self::withTrashed()
            ->where('request_number', 'like', "{$prefix}%")
            ->orderBy('request_number', 'desc')
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->request_number);
            $num = intval(end($parts)) + 1;
        } else {
            $num = 1;
        }

        return sprintf("%s%04d", $prefix, $num);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function items()
    {
        return $this->hasMany(GearRequestItem::class);
    }

    public function assets()
    {
        return $this->belongsToMany(Asset::class, 'gear_request_items')
            ->withPivot('status', 'notes')
            ->withTimestamps();
    }

    public function checkout()
    {
        return $this->hasOne(Checkout::class);
    }
}
