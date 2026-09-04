<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory;

    const TYPE_PRE_CHECKOUT = 'pre_checkout';
    const TYPE_POST_RETURN = 'post_return';

    protected $fillable = [
        'checkout_id',
        'type',
        'inspector_id',
        'inspected_at',
        'overall_passed',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'inspected_at' => 'datetime',
            'overall_passed' => 'boolean',
        ];
    }

    public function checkout()
    {
        return $this->belongsTo(Checkout::class);
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function items()
    {
        return $this->hasMany(InspectionItem::class);
    }
}
