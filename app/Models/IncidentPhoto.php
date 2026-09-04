<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncidentPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'incident_id',
        'file_path',
        'caption',
    ];

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }
}
