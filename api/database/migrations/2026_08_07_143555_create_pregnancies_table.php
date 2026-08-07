<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pregnancies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('lmp_date'); // HPHT
            $table->date('edd_date')->nullable(); // HPL
            $table->boolean('edd_overridden')->default(false);
            $table->smallInteger('gravida')->nullable();
            $table->smallInteger('para')->nullable();
            $table->smallInteger('abortus')->nullable();
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->decimal('weight_prepregnancy_kg', 5, 1)->nullable();
            $table->decimal('weight_current_kg', 5, 1)->nullable();
            $table->string('blood_type', 5)->nullable();
            $table->jsonb('medical_history')->nullable();
            $table->string('facility_name', 150)->nullable();
            $table->string('facility_contact', 50)->nullable();
            $table->enum('status', ['active', 'completed', 'archived'])->default('active');
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        // Hanya satu status=active per user — dijaga di level DB (bukan cuma
        // service logic) supaya kebal terhadap race condition. PRD §9 F-03.
        DB::statement(
            'CREATE UNIQUE INDEX pregnancies_one_active_per_user ON pregnancies (user_id) WHERE status = \'active\''
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('pregnancies');
    }
};
