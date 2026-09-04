<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnRecord extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'checkout_id',
        'user_id',
        'receiver_id',
        'return_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'return_date' => 'datetime',
        ];
    }

    public function checkout()
    {
        return $this->belongsTo(Checkout::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function items()
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }
}
