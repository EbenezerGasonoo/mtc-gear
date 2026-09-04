<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkout_id')->constrained('checkouts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // borrower who returned
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete(); // overseer receiver
            $table->dateTime('return_date')->index();
            $table->string('status', 30)->default('completed')->index(); // completed, damaged, missing_items
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('condition_after', 30)->default('excellent');
            $table->boolean('is_damaged')->default(false);
            $table->boolean('is_missing')->default(false);
            $table->boolean('requires_maintenance')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('returns');
    }
};
