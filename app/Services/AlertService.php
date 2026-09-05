<?php

namespace App\Services;

use App\Mail\MtcGearAlertMail;
use App\Models\User;
use App\Models\Webhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AlertService
{
    /**
     * Dispatch multi-channel alerts (Email & WhatsApp).
     */
    public static function dispatch(
        string $event,
        string $title,
        string $message,
        array $meta = [],
        ?string $link = null,
        ?int $recipientUserId = null
    ): void {
        // 1. Send Email Notification
        self::sendEmailAlert($event, $title, $message, $meta, $link, $recipientUserId);

        // 2. Dispatch WhatsApp / Custom Webhooks
        self::sendWhatsAppWebhooks($event, $title, $message, $meta, $link);
    }

    /**
     * Dispatch branded transactional HTML email.
     */
    protected static function sendEmailAlert(
        string $event,
        string $title,
        string $message,
        array $meta = [],
        ?string $link = null,
        ?int $recipientUserId = null
    ): void {
        try {
            $recipients = [];

            if ($recipientUserId) {
                $user = User::find($recipientUserId);
                if ($user && !empty($user->email)) {
                    $recipients[] = $user->email;
                }
            } else {
                // Default to overseers and admins
                $overseers = User::whereIn('role', ['super_admin', 'gear_overseer'])->get();
                foreach ($overseers as $o) {
                    if (!empty($o->email)) {
                        $recipients[] = $o->email;
                    }
                }
            }

            $recipients = array_unique(array_filter($recipients));

            foreach ($recipients as $email) {
                Mail::to($email)->send(new MtcGearAlertMail($event, $title, $message, $meta, $link));
            }
        } catch (\Throwable $e) {
            Log::warning("[AlertService] Email dispatch failed: " . $e->getMessage());
        }
    }

    /**
     * Dispatch formatted WhatsApp webhooks.
     */
    protected static function sendWhatsAppWebhooks(
        string $event,
        string $title,
        string $message,
        array $meta = [],
        ?string $link = null
    ): void {
        try {
            $webhooks = Webhook::where('is_active', true)->get();

            foreach ($webhooks as $webhook) {
                if (!$webhook->isSubscribedTo($event)) {
                    continue;
                }

                self::sendSingleWebhook($webhook, $event, $title, $message, $meta, $link);
            }
        } catch (\Throwable $e) {
            Log::warning("[AlertService] Webhook query failed: " . $e->getMessage());
        }
    }

    /**
     * Send payload to a single webhook endpoint.
     */
    public static function sendSingleWebhook(
        Webhook $webhook,
        string $event,
        string $title,
        string $message,
        array $meta = [],
        ?string $link = null
    ): array {
        // Build formatted WhatsApp message string
        $whatsAppText = "⛰️ *MTC GEAR ALERT: " . strtoupper($title) . "*\n";
        $whatsAppText .= "----------------------------------------\n";
        $whatsAppText .= $message . "\n\n";

        if (!empty($meta)) {
            $whatsAppText .= "*📋 Details:*\n";
            foreach ($meta as $key => $val) {
                $formattedVal = is_array($val) ? implode(', ', $val) : $val;
                $whatsAppText .= "• *" . $key . ":* " . $formattedVal . "\n";
            }
            $whatsAppText .= "\n";
        }

        if ($link) {
            $whatsAppText .= "🔗 *Link:* " . $link . "\n";
        }

        $whatsAppText .= "----------------------------------------\n";
        $whatsAppText .= "_Mountain Top Communications &bull; Equipment Custody_";

        $payload = [
            'event' => $event,
            'title' => $title,
            'message' => $message,
            'whatsapp_formatted_text' => $whatsAppText,
            'meta' => $meta,
            'link' => $link,
            'phone_number' => $webhook->phone_number,
            'timestamp' => now()->toIso8601String(),
        ];

        try {
            $request = Http::timeout(6)->withHeaders([
                'Content-Type' => 'application/json',
                'User-Agent' => 'MTC-GEAR-Webhook/1.0',
            ]);

            if (!empty($webhook->secret)) {
                $request = $request->withToken($webhook->secret);
            }

            $response = $request->post($webhook->url, $payload);

            $webhook->update([
                'last_triggered_at' => now(),
                'last_status_code' => $response->status(),
                'last_error' => $response->successful() ? null : substr($response->body(), 0, 500),
            ]);

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500),
            ];
        } catch (\Throwable $e) {
            $webhook->update([
                'last_triggered_at' => now(),
                'last_status_code' => 500,
                'last_error' => substr($e->getMessage(), 0, 500),
            ]);

            return [
                'success' => false,
                'status' => 500,
                'error' => $e->getMessage(),
            ];
        }
    }
}
