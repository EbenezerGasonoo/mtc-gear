<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public static function send(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        array $meta = []
    ): Notification {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'is_read' => false,
        ]);

        // Dispatch Email & WhatsApp alerts
        try {
            AlertService::dispatch(
                $type,
                $title,
                $message,
                $meta,
                $link ? url($link) : null,
                $userId
            );
        } catch (\Throwable $e) {
            Log::warning("[NotificationService] AlertService dispatch failed: " . $e->getMessage());
        }

        return $notification;
    }

    public static function notifyOverseers(
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        array $meta = []
    ): void {
        $overseers = User::whereIn('role', ['super_admin', 'gear_overseer'])->get();
        foreach ($overseers as $overseer) {
            Notification::create([
                'user_id' => $overseer->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'link' => $link,
                'is_read' => false,
            ]);
        }

        // Dispatch Email to overseers & trigger WhatsApp webhooks once
        try {
            AlertService::dispatch(
                $type,
                $title,
                $message,
                $meta,
                $link ? url($link) : null,
                null // Broadcast to overseers
            );
        } catch (\Throwable $e) {
            Log::warning("[NotificationService] AlertService overseer broadcast failed: " . $e->getMessage());
        }
    }
}
