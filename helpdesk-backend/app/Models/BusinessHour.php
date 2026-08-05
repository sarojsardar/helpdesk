<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessHour extends Model
{
    protected $fillable = ['day_of_week', 'start_time', 'end_time', 'is_working_day'];

    protected function casts(): array
    {
        return ['is_working_day' => 'boolean'];
    }

    /**
     * Day name helper.
     */
    public function getDayNameAttribute(): string
    {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$this->day_of_week] ?? '';
    }
}
