<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Checkout extends Model
{
    use HasFactory;

    const STATUS_CHECKED_OUT = 'checked_out';
    const STATUS_RETURNED = 'returned';
    const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'gear_request_id',
        'user_id',
        'inspector_id',
        'checkout_date',
        'expected_return_date',
        'status',
        'handover_signed_at',
        'handover_ip',
        'handover_user_agent',
        'digital_signature_hash',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'checkout_date' => 'datetime',
            'expected_return_date' => 'datetime',
            'handover_signed_at' => 'datetime',
        ];
    }

    public function request()
    {
        return $this->belongsTo(GearRequest::class, 'gear_request_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function items()
    {
        return $this->hasMany(CheckoutItem::class);
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnRecord::class, 'checkout_id');
    }
}
