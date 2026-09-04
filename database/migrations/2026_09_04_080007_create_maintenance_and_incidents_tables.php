<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('status', 30)->default('scheduled')->index(); // scheduled, in_progress, completed, cancelled
            $table->text('issue_description');
            $table->string('provider_name')->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->date('scheduled_date')->index();
            $table->date('started_date')->nullable();
            $table->date('completed_date')->nullable();
            $table->string('performed_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('incident_number', 30)->unique()->index(); // INC-YYYY-XXXX
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('reported_by_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('checkout_id')->nullable()->constrained('checkouts')->nullOnDelete();
            $table->string('type', 30)->index(); // damage, missing, lost, technical_fault, accessory_missing, other
            $table->string('severity', 20)->default('medium')->index(); // low, medium, high, critical
            $table->date('incident_date')->index();
            $table->string('project_name')->nullable();
            $table->text('description');
            $table->text('resolution')->nullable();
            $table->foreignId('resolved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('incident_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('caption')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_photos');
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('maintenance_records');
    }
};
