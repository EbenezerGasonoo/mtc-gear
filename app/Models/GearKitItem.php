<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GearKitItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'gear_kit_id',
        'asset_id',
        'quantity',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'quantity' => 'integer',
        ];
    }

    public function kit()
    {
        return $this->belongsTo(GearKit::class, 'gear_kit_id');
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
