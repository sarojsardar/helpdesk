<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');                              // e.g. "Critical SLA", "Default SLA"
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'critical']);
            $table->unsignedInteger('response_minutes');         // Time to first response
            $table->unsignedInteger('resolution_minutes');       // Time to resolution
            $table->boolean('business_hours_only')->default(true); // Only count business hours
            $table->boolean('is_active')->default(true);
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete(); // Optional: category-specific SLA
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete(); // Optional: department-specific SLA
            $table->timestamps();

            $table->index(['priority', 'is_active']);
            $table->index('category_id');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_policies');
    }
};
