<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ticket_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');                          // e.g. "Password Reset Request"
            $table->text('description')->nullable();         // Helper text shown in picker
            $table->string('icon')->nullable();              // Emoji or icon identifier
            $table->text('description_template')->nullable(); // Pre-filled description body
            $table->enum('default_priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->foreignId('default_category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->json('custom_fields')->nullable();       // [{label, type, required, options}]
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_templates');
    }
};
