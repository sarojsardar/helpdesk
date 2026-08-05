<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ticket_ratings', function (Blueprint $table) {
            $table->boolean('resolution_helpful')->nullable()->after('comment');
            $table->unsignedTinyInteger('response_speed')->nullable()->after('resolution_helpful');
            $table->unsignedTinyInteger('communication_rating')->nullable()->after('response_speed');
            $table->boolean('would_recommend')->nullable()->after('communication_rating');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_ratings', function (Blueprint $table) {
            $table->dropColumn(['resolution_helpful', 'response_speed', 'communication_rating', 'would_recommend']);
        });
    }
};
