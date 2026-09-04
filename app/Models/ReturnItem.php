<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id',
        'asset_id',
        'condition_after',
        'is_damaged',
        'is_missing',
        'requires_maintenance',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_damaged' => 'boolean',
            'is_missing' => 'boolean',
            'requires_maintenance' => 'boolean',
        ];
    }

    public function returnRecord()
    {
        return $this->belongsTo(ReturnRecord::class, 'return_id');
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
