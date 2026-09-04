<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gear_request_id')->constrained('gear_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // borrower
            $table->foreignId('inspector_id')->constrained('users')->cascadeOnDelete(); // overseer who inspected
            $table->dateTime('checkout_date')->index();
            $table->dateTime('expected_return_date')->index();
            $table->string('status', 30)->default('checked_out')->index(); // checked_out, returned, overdue
            $table->dateTime('handover_signed_at')->nullable();
            $table->string('handover_ip', 45)->nullable();
            $table->text('handover_user_agent')->nullable();
            $table->string('digital_signature_hash')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('checkout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkout_id')->constrained('checkouts')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('condition_before', 30)->default('excellent');
            $table->json('accessories_included')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkout_id')->constrained('checkouts')->cascadeOnDelete();
            $table->string('type', 30)->index(); // pre_checkout, post_return
            $table->foreignId('inspector_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('inspected_at')->index();
            $table->boolean('overall_passed')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inspection_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('condition', 30)->default('excellent');
            $table->json('accessories_verified')->nullable();
            $table->text('damage_notes')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_items');
        Schema::dropIfExists('inspections');
        Schema::dropIfExists('checkout_items');
        Schema::dropIfExists('checkouts');
    }
};
