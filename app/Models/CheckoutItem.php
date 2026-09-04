<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'checkout_id',
        'asset_id',
        'condition_before',
        'accessories_included',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'accessories_included' => 'array',
        ];
    }

    public function checkout()
    {
        return $this->belongsTo(Checkout::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
