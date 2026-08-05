<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sunday, 1=Monday, ..., 6=Saturday
            $table->time('start_time');                  // e.g. 09:00
            $table->time('end_time');                    // e.g. 17:00
            $table->boolean('is_working_day')->default(true);
            $table->timestamps();

            $table->unique('day_of_week');
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // e.g. "Christmas Day"
            $table->date('date');                // Specific date
            $table->boolean('is_recurring')->default(false); // Recurs every year
            $table->timestamps();

            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('business_hours');
    }
};
