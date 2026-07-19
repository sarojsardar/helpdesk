<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ticket_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', [
                'created', 'assigned', 'replied', 'status_changed',
                'priority_changed', 'escalated', 'resolved', 'closed',
                'sla_breach', 'notified'
            ]);
            $table->json('payload')->nullable(); // extra context
            $table->timestamps();

            $table->index(['ticket_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_events');
    }
};
