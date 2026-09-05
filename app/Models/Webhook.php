<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Webhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'service_type',
        'url',
        'secret',
        'phone_number',
        'events',
        'is_active',
        'last_triggered_at',
        'last_status_code',
        'last_error',
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
        'last_status_code' => 'integer',
    ];

    public function isSubscribedTo(string $event): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if (empty($this->events)) {
            return true; // Subscribed to all events if empty
        }

        return in_array('*', $this->events) || in_array($event, $this->events);
    }
}
