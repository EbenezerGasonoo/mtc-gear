<?php

namespace App\Console\Commands;

use App\Models\Checkout;
use App\Services\AuditService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class CheckOverdueCheckouts extends Command
{
    protected $signature = 'gear:check-overdue';
    protected $description = 'Scan active checkouts and flag overdue equipment deployments';

    public function handle(): int
    {
        $overdueCheckouts = Checkout::where('status', Checkout::STATUS_CHECKED_OUT)
            ->where('expected_return_date', '<', now())
            ->with(['user', 'request', 'items.asset'])
            ->get();

        $count = $overdueCheckouts->count();
        $this->info("Found {$count} overdue checkouts.");

        foreach ($overdueCheckouts as $checkout) {
            $checkout->update(['status' => Checkout::STATUS_OVERDUE]);

            if ($checkout->request) {
                $checkout->request->update(['status' => 'overdue']);
            }

            // Notify borrower
            NotificationService::send(
                userId: $checkout->user_id,
                type: 'equipment_overdue',
                title: "OVERDUE NOTICE: Equipment Return Required",
                message: "Your equipment for project '{$checkout->request->project_name}' was due on " . $checkout->expected_return_date->format('d M Y') . ". Please return immediately.",
                link: "/checkouts/{$checkout->id}"
            );

            // Notify overseers
            NotificationService::notifyOverseers(
                type: 'equipment_overdue_alert',
                title: "ALERT: Overdue Deployment Detected",
                message: "{$checkout->user->name} has not returned gear for '{$checkout->request->project_name}' (Due: {$checkout->expected_return_date->format('d M Y')}).",
                link: "/checkouts/{$checkout->id}"
            );

            AuditService::log(
                action: 'checkout_marked_overdue',
                entityType: 'Checkout',
                entityId: $checkout->id,
                oldValues: ['status' => 'checked_out'],
                newValues: ['status' => 'overdue']
            );
        }

        $this->info("Overdue check complete.");
        return Command::SUCCESS;
    }
}
