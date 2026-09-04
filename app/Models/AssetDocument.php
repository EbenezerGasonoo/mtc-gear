<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'file_path',
        'title',
        'file_type',
        'file_size',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
