<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\GearRequest;
use Carbon\Carbon;

class AvailabilityService
{
    /**
     * Check if a single asset is available for the given date range.
     *
     * @param int $assetId
     * @param string|Carbon $startDate
     * @param string|Carbon $endDate
     * @param int|null $excludeRequestId (to ignore current request when editing)
     * @return array ['is_available' => bool, 'reason' => string|null, 'conflict' => array|null]
     */
    public static function checkAsset(int $assetId, mixed $startDate, mixed $endDate, ?int $excludeRequestId = null): array
    {
        $asset = Asset::find($assetId);
        if (!$asset) {
            return [
                'is_available' => false,
                'reason' => 'Asset not found.',
                'conflict' => null,
            ];
        }

        // 1. Check inherent status
        if (!$asset->isRequestable()) {
            return [
                'is_available' => false,
                'reason' => "Asset is currently in " . strtoupper($asset->status) . " status and cannot be reserved.",
                'conflict' => null,
            ];
        }

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // 2. Check overlapping approved/checked_out/pending requests
        $conflictingRequests = GearRequest::query()
            ->whereIn('status', [
                GearRequest::STATUS_APPROVED,
                GearRequest::STATUS_CHECKED_OUT,
                GearRequest::STATUS_UNDER_REVIEW,
                GearRequest::STATUS_PARTIALLY_APPROVED,
                GearRequest::STATUS_OVERDUE,
            ])
            ->when($excludeRequestId, fn($q) => $q->where('id', '!=', $excludeRequestId))
            ->whereHas('items', function ($query) use ($assetId) {
                $query->where('asset_id', $assetId)
                      ->where('status', '!=', 'rejected');
            })
            ->where(function ($query) use ($start, $end) {
                // Collision: start_date <= requested_end AND expected_return_date >= requested_start
                $query->where('start_date', '<=', $end->toDateString())
                      ->where('expected_return_date', '>=', $start->toDateString());
            })
            ->with(['user'])
            ->get();

        if ($conflictingRequests->isNotEmpty()) {
            $first = $conflictingRequests->first();
            $borrower = $first->user ? $first->user->name : 'Another team member';
            return [
                'is_available' => false,
                'reason' => "Reserved by {$borrower} for project '{$first->project_name}' from " .
                            Carbon::parse($first->start_date)->format('d M Y') . " to " .
                            Carbon::parse($first->expected_return_date)->format('d M Y') . ".",
                'conflict' => [
                    'request_id' => $first->id,
                    'request_number' => $first->request_number,
                    'project_name' => $first->project_name,
                    'user_name' => $borrower,
                    'start_date' => $first->start_date->toDateString(),
                    'return_date' => $first->expected_return_date->toDateString(),
                    'status' => $first->status,
                ],
            ];
        }

        return [
            'is_available' => true,
            'reason' => null,
            'conflict' => null,
        ];
    }

    /**
     * Check multiple assets for date availability.
     *
     * @param array $assetIds
     * @param string|Carbon $startDate
     * @param string|Carbon $endDate
     * @param int|null $excludeRequestId
     * @return array [asset_id => ['is_available' => bool, 'reason' => string|null]]
     */
    public static function checkMultiple(array $assetIds, mixed $startDate, mixed $endDate, ?int $excludeRequestId = null): array
    {
        $results = [];
        foreach ($assetIds as $id) {
            $results[$id] = self::checkAsset($id, $startDate, $endDate, $excludeRequestId);
        }
        return $results;
    }
}
