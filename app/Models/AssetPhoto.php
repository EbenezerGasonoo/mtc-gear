<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'file_path',
        'is_primary',
        'caption',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
