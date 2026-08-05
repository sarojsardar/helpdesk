<?php

namespace App\Console\Commands;

use App\Services\EscalationService;
use Illuminate\Console\Command;

class ProcessEscalations extends Command
{
    protected $signature = 'tickets:escalate';
    protected $description = 'Process escalation rules against open tickets';

    public function handle(EscalationService $service): int
    {
        $count = $service->processAll();

        $this->info("Processed escalations: {$count} ticket(s) escalated.");

        return self::SUCCESS;
    }
}
