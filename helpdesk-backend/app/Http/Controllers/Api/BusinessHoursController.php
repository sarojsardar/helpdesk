<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessHour;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BusinessHoursController extends Controller
{
    /**
     * Get full schedule (7 days).
     */
    public function index()
    {
        $hours = BusinessHour::orderBy('day_of_week')->get();

        return response()->json(['success' => true, 'data' => $hours]);
    }

    /**
     * Set/update schedule for all days at once.
     */
    public function updateSchedule(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'schedule'                     => 'required|array|size:7',
            'schedule.*.day_of_week'       => 'required|integer|between:0,6',
            'schedule.*.start_time'        => 'required|date_format:H:i',
            'schedule.*.end_time'          => 'required|date_format:H:i|after:schedule.*.start_time',
            'schedule.*.is_working_day'    => 'required|boolean',
        ]);

        foreach ($data['schedule'] as $day) {
            BusinessHour::updateOrCreate(
                ['day_of_week' => $day['day_of_week']],
                [
                    'start_time'     => $day['start_time'],
                    'end_time'       => $day['end_time'],
                    'is_working_day' => $day['is_working_day'],
                ]
            );
        }

        Cache::forget('business_hours_schedule');

        return response()->json(['success' => true, 'message' => 'Business hours updated']);
    }

    /**
     * List all holidays.
     */
    public function holidays()
    {
        $holidays = Holiday::orderBy('date')->get();

        return response()->json(['success' => true, 'data' => $holidays]);
    }

    /**
     * Create a holiday.
     */
    public function storeHoliday(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'date'         => 'required|date',
            'is_recurring' => 'boolean',
        ]);

        $holiday = Holiday::create($data);
        Cache::forget('holidays_list');

        return response()->json(['success' => true, 'data' => $holiday, 'message' => 'Holiday added'], 201);
    }

    /**
     * Delete a holiday.
     */
    public function destroyHoliday(Holiday $holiday)
    {
        $this->authorize('manage', \App\Models\User::class);

        $holiday->delete();
        Cache::forget('holidays_list');

        return response()->json(['success' => true, 'message' => 'Holiday removed']);
    }
}
