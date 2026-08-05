<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Prune expired Sanctum tokens daily
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Process escalation rules every 5 minutes
Schedule::command('tickets:escalate')
    ->everyFiveMinutes()
    ->name('process-escalation-rules')
    ->withoutOverlapping();
