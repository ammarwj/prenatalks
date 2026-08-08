<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_checklist_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // NULL = item pribadi pengguna (judulnya di `custom_title`), sesuai
            // skema PRD §10. Baris progres template dibuat saat pertama kali
            // dicentang — tidak dibuat massal di awal, supaya menambah item
            // template baru di panel admin tidak perlu menyentuh data pengguna.
            $table->foreignId('checklist_item_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('custom_title', 200)->nullable();

            $table->boolean('is_checked')->default(false);
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();

            // NULL dianggap berbeda satu sama lain baik di PostgreSQL maupun
            // SQLite, jadi batasan ini mencegah duplikasi progres item template
            // tanpa membatasi jumlah item pribadi per pengguna.
            $table->unique(['user_id', 'checklist_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_checklist_progress');
    }
};
