<?php

use App\Services\EscalationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Prune expired Sanctum tokens daily
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Escalate overdue unassigned tickets every 30 minutes
Schedule::call(function () {
    $count = app(EscalationService::class)->escalateOverdue();
    if ($count > 0) {
        Log::info("Escalated {$count} overdue ticket(s).");
    }
})->everyThirtyMinutes()->name('escalate-overdue-tickets')->withoutOverlapping();
