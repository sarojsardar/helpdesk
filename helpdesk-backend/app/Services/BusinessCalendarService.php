<?php

namespace App\Services;

use App\Models\BusinessHour;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class BusinessCalendarService
{
    /**
     * Calculate the deadline by adding business minutes to a start time.
     * Respects working hours and holidays.
     */
    public function addBusinessMinutes(Carbon $start, int $minutes): Carbon
    {
        $schedule = $this->getSchedule();
        $holidays = $this->getHolidays();

        // If no business hours configured, fall back to raw calendar time
        if (empty($schedule)) {
            return $start->copy()->addMinutes($minutes);
        }

        $current   = $start->copy();
        $remaining = $minutes;

        // Safety: max 365 days of iteration
        $maxIterations = 365 * 24 * 60;
        $iterations    = 0;

        while ($remaining > 0 && $iterations++ < $maxIterations) {
            $dayOfWeek = $current->dayOfWeek; // 0=Sun, 6=Sat
            $dayConfig = $schedule[$dayOfWeek] ?? null;

            // Skip non-working days
            if (!$dayConfig || !$dayConfig['is_working_day'] || $this->isHoliday($current, $holidays)) {
                $current->addDay()->startOfDay();
                continue;
            }

            $dayStart = $current->copy()->setTimeFromTimeString($dayConfig['start_time']);
            $dayEnd   = $current->copy()->setTimeFromTimeString($dayConfig['end_time']);

            // If current time is before business start, move to start
            if ($current->lt($dayStart)) {
                $current = $dayStart->copy();
            }

            // If current time is at/past business end, move to next day
            if ($current->gte($dayEnd)) {
                $current->addDay()->startOfDay();
                continue;
            }

            // Calculate available minutes remaining in this business day
            $availableMinutes = $current->diffInMinutes($dayEnd);

            if ($remaining <= $availableMinutes) {
                $current->addMinutes($remaining);
                $remaining = 0;
            } else {
                $remaining -= $availableMinutes;
                $current->addDay()->startOfDay();
            }
        }

        return $current;
    }

    /**
     * Check if a given date is a holiday.
     */
    private function isHoliday(Carbon $date, array $holidays): bool
    {
        foreach ($holidays as $holiday) {
            if ($holiday['is_recurring']) {
                // Match month and day regardless of year
                if ($date->month === (int) Carbon::parse($holiday['date'])->month
                    && $date->day === (int) Carbon::parse($holiday['date'])->day) {
                    return true;
                }
            } else {
                if ($date->isSameDay(Carbon::parse($holiday['date']))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get business hours schedule indexed by day_of_week. Cached for 1 hour.
     */
    private function getSchedule(): array
    {
        return Cache::remember('business_hours_schedule', 3600, function () {
            return BusinessHour::all()
                ->keyBy('day_of_week')
                ->map(fn($bh) => [
                    'start_time'     => $bh->start_time,
                    'end_time'       => $bh->end_time,
                    'is_working_day' => $bh->is_working_day,
                ])
                ->toArray();
        });
    }

    /**
     * Get holidays list. Cached for 1 hour.
     */
    private function getHolidays(): array
    {
        return Cache::remember('holidays_list', 3600, function () {
            return Holiday::all()->map(fn($h) => [
                'date'         => $h->date->toDateString(),
                'is_recurring' => $h->is_recurring,
            ])->toArray();
        });
    }
}
