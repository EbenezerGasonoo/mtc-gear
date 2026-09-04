<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id', 30)->unique()->index(); // e.g. MTC-CAM-001
            $table->string('name')->index();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('brand')->index();
            $table->string('model')->index();
            $table->string('serial_number')->index();
            $table->text('description')->nullable();
            $table->string('condition', 20)->default('excellent')->index(); // excellent, good, fair, minor_damage, damaged
            $table->string('status', 20)->default('available')->index(); // available, reserved, checked_out, maintenance, damaged, lost, retired
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('qr_code_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('asset_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('file_path');
            $table->boolean('is_primary')->default(false);
            $table->string('caption')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('title');
            $table->string('file_type', 20)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50)->index(); // created, assigned, reserved, checked_out, returned, inspected, damaged, repaired, maintenance, location_changed, status_changed
            $table->string('project_name')->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_history');
        Schema::dropIfExists('asset_documents');
        Schema::dropIfExists('asset_photos');
        Schema::dropIfExists('assets');
    }
};
