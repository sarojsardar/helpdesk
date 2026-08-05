<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE ticket_events MODIFY COLUMN type ENUM(
            'created', 'assigned', 'replied', 'status_changed',
            'priority_changed', 'escalated', 'resolved', 'closed',
            'sla_breach', 'notified', 'snoozed', 'reopened', 'follow_up'
        ) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE ticket_events MODIFY COLUMN type ENUM(
            'created', 'assigned', 'replied', 'status_changed',
            'priority_changed', 'escalated', 'resolved', 'closed',
            'sla_breach', 'notified'
        ) NOT NULL");
    }
};
