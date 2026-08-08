<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_items', function (Blueprint $table) {
            $table->id();

            // Kelompok dikunci ke lima nilai di PRD §9 F-11 (divalidasi lewat
            // ChecklistItem::GROUPS), disimpan sebagai string alih-alih tabel
            // terpisah karena daftarnya tetap dan tidak dikelola admin.
            $table->string('group_name', 60);

            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'group_name', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_items');
    }
};
