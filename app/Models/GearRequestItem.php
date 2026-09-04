<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GearRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'gear_request_id',
        'asset_id',
        'status',
        'notes',
    ];

    public function request()
    {
        return $this->belongsTo(GearRequest::class, 'gear_request_id');
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
