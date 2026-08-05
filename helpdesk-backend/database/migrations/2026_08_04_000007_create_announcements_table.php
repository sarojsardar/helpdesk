<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->enum('type', ['info', 'warning', 'success', 'danger'])->default('info');
            $table->json('target_roles')->nullable(); // null = all roles, or ['admin','staff','user']
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();  // null = immediately active
            $table->timestamp('expires_at')->nullable(); // null = never expires
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'starts_at', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
