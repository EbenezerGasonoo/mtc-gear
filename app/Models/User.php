<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'department',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isGearOverseer(): bool
    {
        return $this->role === 'gear_overseer';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    public function isViewer(): bool
    {
        return $this->role === 'viewer';
    }

    public function canManageEquipment(): bool
    {
        return in_array($this->role, ['super_admin', 'gear_overseer']);
    }

    public function canApproveRequests(): bool
    {
        return in_array($this->role, ['super_admin', 'gear_overseer']);
    }

    public function requests()
    {
        return $this->hasMany(GearRequest::class);
    }

    public function checkouts()
    {
        return $this->hasMany(Checkout::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnRecord::class);
    }

    public function assignedAssets()
    {
        return $this->hasMany(Asset::class, 'assigned_user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->latest();
    }
}
