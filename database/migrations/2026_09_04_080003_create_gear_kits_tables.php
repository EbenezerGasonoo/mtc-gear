<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gear_kits', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('code', 30)->unique()->index(); // e.g. KIT-DOC-001
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('gear_kit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gear_kit_id')->constrained('gear_kits')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gear_kit_items');
        Schema::dropIfExists('gear_kits');
    }
};
