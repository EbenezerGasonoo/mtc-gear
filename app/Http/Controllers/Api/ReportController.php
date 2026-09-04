<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Checkout;
use App\Models\CheckoutItem;
use App\Models\Incident;
use App\Models\MaintenanceRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function inventory(): JsonResponse
    {
        $assets = Asset::with(['category', 'location', 'assignedUser'])->get();

        $valuation = $assets->sum('purchase_price');
        $byStatus = $assets->groupBy('status')->map->count();
        $byCategory = $assets->groupBy(fn($a) => $a->category->name ?? 'Uncategorized')->map->count();

        return response()->json([
            'total_assets' => $assets->count(),
            'total_valuation' => $valuation,
            'by_status' => $byStatus,
            'by_category' => $byCategory,
            'assets' => $assets,
        ]);
    }

    public function deployment(): JsonResponse
    {
        $activeCheckouts = Checkout::with(['user', 'request', 'items.asset.category', 'inspector'])
            ->whereIn('status', [Checkout::STATUS_CHECKED_OUT, Checkout::STATUS_OVERDUE])
            ->latest('checkout_date')
            ->get();

        return response()->json([
            'total_deployed' => $activeCheckouts->count(),
            'checkouts' => $activeCheckouts,
        ]);
    }

    public function overdue(): JsonResponse
    {
        $overdueCheckouts = Checkout::with(['user', 'request', 'items.asset'])
            ->where('status', Checkout::STATUS_OVERDUE)
            ->orWhere(function ($q) {
                $q->where('status', Checkout::STATUS_CHECKED_OUT)
                  ->where('expected_return_date', '<', now());
            })
            ->get()
            ->map(function ($co) {
                $diffDays = Carbon::parse($co->expected_return_date)->diffInDays(now());
                $arr = $co->toArray();
                $arr['days_overdue'] = $diffDays;
                return $arr;
            });

        return response()->json([
            'total_overdue' => $overdueCheckouts->count(),
            'checkouts' => $overdueCheckouts,
        ]);
    }

    public function utilization(): JsonResponse
    {
        // Most frequently checked out assets
        $stats = CheckoutItem::selectRaw('asset_id, COUNT(*) as checkout_count')
            ->groupBy('asset_id')
            ->orderByDesc('checkout_count')
            ->with(['asset.category'])
            ->limit(20)
            ->get();

        return response()->json($stats);
    }

    public function staffUsage(): JsonResponse
    {
        $staffStats = User::whereHas('checkouts')
            ->withCount('checkouts')
            ->with(['checkouts' => fn($q) => $q->latest()->limit(5)])
            ->get();

        return response()->json($staffStats);
    }

    public function maintenance(): JsonResponse
    {
        $records = MaintenanceRecord::with(['asset.category'])->latest('scheduled_date')->get();
        $totalCost = $records->sum('cost');

        return response()->json([
            'total_records' => $records->count(),
            'total_cost' => $totalCost,
            'records' => $records,
        ]);
    }

    public function damage(): JsonResponse
    {
        $incidents = Incident::with(['asset.category', 'reportedBy'])->latest('incident_date')->get();
        $bySeverity = $incidents->groupBy('severity')->map->count();

        return response()->json([
            'total_incidents' => $incidents->count(),
            'by_severity' => $bySeverity,
            'incidents' => $incidents,
        ]);
    }

    public function exportCsv(string $type): StreamedResponse
    {
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=mtc-gear-{$type}-report-" . date('Y-m-d') . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'inventory') {
                fputcsv($handle, ['Asset ID', 'Name', 'Category', 'Brand', 'Model', 'Serial Number', 'Status', 'Condition', 'Location', 'Purchase Price', 'Purchase Date']);
                $assets = Asset::with(['category', 'location'])->get();
                foreach ($assets as $a) {
                    fputcsv($handle, [
                        $a->asset_id,
                        $a->name,
                        $a->category->name ?? '',
                        $a->brand,
                        $a->model,
                        $a->serial_number,
                        strtoupper($a->status),
                        ucfirst($a->condition),
                        $a->location->name ?? '',
                        $a->purchase_price,
                        $a->purchase_date ? $a->purchase_date->format('Y-m-d') : '',
                    ]);
                }
            } elseif ($type === 'deployment') {
                fputcsv($handle, ['Checkout ID', 'Borrower', 'Project', 'Checkout Date', 'Expected Return', 'Status', 'Items Count']);
                $checkouts = Checkout::with(['user', 'request', 'items'])->whereIn('status', [Checkout::STATUS_CHECKED_OUT, Checkout::STATUS_OVERDUE])->get();
                foreach ($checkouts as $co) {
                    fputcsv($handle, [
                        $co->id,
                        $co->user->name ?? '',
                        $co->request->project_name ?? '',
                        $co->checkout_date->format('Y-m-d H:i'),
                        $co->expected_return_date->format('Y-m-d H:i'),
                        strtoupper($co->status),
                        $co->items->count(),
                    ]);
                }
            } elseif ($type === 'maintenance') {
                fputcsv($handle, ['Asset ID', 'Asset Name', 'Status', 'Issue Description', 'Provider', 'Cost', 'Scheduled Date', 'Completed Date']);
                $records = MaintenanceRecord::with('asset')->get();
                foreach ($records as $r) {
                    fputcsv($handle, [
                        $r->asset->asset_id ?? '',
                        $r->asset->name ?? '',
                        strtoupper($r->status),
                        $r->issue_description,
                        $r->provider_name ?? '',
                        $r->cost,
                        $r->scheduled_date ? $r->scheduled_date->format('Y-m-d') : '',
                        $r->completed_date ? $r->completed_date->format('Y-m-d') : '',
                    ]);
                }
            } elseif ($type === 'damage') {
                fputcsv($handle, ['Incident #', 'Asset ID', 'Asset Name', 'Type', 'Severity', 'Reported By', 'Date', 'Description', 'Status']);
                $incidents = Incident::with(['asset', 'reportedBy'])->get();
                foreach ($incidents as $inc) {
                    fputcsv($handle, [
                        $inc->incident_number,
                        $inc->asset->asset_id ?? '',
                        $inc->asset->name ?? '',
                        strtoupper($inc->type),
                        strtoupper($inc->severity),
                        $inc->reportedBy->name ?? '',
                        $inc->incident_date->format('Y-m-d'),
                        $inc->description,
                        $inc->resolved_at ? 'RESOLVED' : 'OPEN',
                    ]);
                }
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
