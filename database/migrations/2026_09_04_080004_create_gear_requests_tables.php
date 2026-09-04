<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gear_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 30)->unique()->index(); // REQ-YYYY-XXXX
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('project_name')->index();
            $table->text('purpose');
            $table->string('destination_location');
            $table->date('start_date')->index();
            $table->time('start_time')->nullable();
            $table->date('expected_return_date')->index();
            $table->time('expected_return_time')->nullable();
            $table->string('status', 30)->default('pending')->index(); 
            // pending, under_review, approved, partially_approved, rejected, cancelled, checked_out, returned, overdue
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('change_request_notes')->nullable();
            $table->text('admin_override_reason')->nullable();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('gear_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gear_request_id')->constrained('gear_requests')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('status', 20)->default('pending')->index(); // pending, approved, rejected
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gear_request_items');
        Schema::dropIfExists('gear_requests');
    }
};
