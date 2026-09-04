<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public static function send(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $link = null
    ): Notification {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'is_read' => false,
        ]);

        // Attempt email dispatch if mailer is configured
        try {
            $user = User::find($userId);
            if ($user && $user->email && config('mail.default') !== 'log') {
                // Can queue/send transactional email
            }
        } catch (\Throwable $e) {
            Log::warning("Could not dispatch email notification: " . $e->getMessage());
        }

        return $notification;
    }

    public static function notifyOverseers(string $type, string $title, string $message, ?string $link = null): void
    {
        $overseers = User::whereIn('role', ['super_admin', 'gear_overseer'])->get();
        foreach ($overseers as $overseer) {
            self::send($overseer->id, $type, $title, $message, $link);
        }
    }
}
