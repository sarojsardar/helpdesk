<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('escalation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('trigger_type', [
                'sla_response_breach',   // No first response within SLA
                'sla_resolution_breach', // Not resolved within SLA
                'time_no_update',        // No activity for X minutes
                'priority_age',          // Critical/high ticket open longer than X minutes
            ]);
            $table->unsignedInteger('threshold_minutes'); // How many minutes after trigger condition
            $table->enum('action', [
                'reassign_to_manager',   // Reassign to department manager
                'notify_manager',        // Send notification to manager
                'increase_priority',     // Bump priority one level
                'notify_admins',         // Alert all admins
                'reassign_to_agent',     // Reassign to a specific agent
            ]);
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete(); // For reassign_to_agent
            $table->enum('applies_to_priority', ['low', 'medium', 'high', 'critical'])->nullable(); // Null = all
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('max_escalations')->default(1); // Max times this rule fires per ticket
            $table->timestamps();

            $table->index(['trigger_type', 'is_active']);
        });

        // Track which escalations have fired for each ticket
        Schema::create('ticket_escalations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('escalation_rule_id')->constrained()->cascadeOnDelete();
            $table->string('action_taken');
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'escalation_rule_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_escalations');
        Schema::dropIfExists('escalation_rules');
    }
};
