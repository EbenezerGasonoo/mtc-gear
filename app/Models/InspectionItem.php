<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'asset_id',
        'condition',
        'accessories_verified',
        'damage_notes',
        'photos',
    ];

    protected function casts(): array
    {
        return [
            'accessories_verified' => 'array',
            'photos' => 'array',
        ];
    }

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
