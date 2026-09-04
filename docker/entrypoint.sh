#!/bin/bash
set -e

# Dynamically bind Apache to Render's assigned $PORT (defaults to 80 if not set)
PORT=${PORT:-80}
echo "[MTC-GEAR] Starting container on PORT: $PORT"
sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:$PORT>/g" /etc/apache2/sites-available/000-default.conf

# Ensure required storage and database directories exist
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/database

# Handle SQLite database
if [ "$DB_CONNECTION" = "sqlite" ] || [ -z "$DB_CONNECTION" ]; then
    DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    if [ ! -f "$DB_FILE" ]; then
        echo "[MTC-GEAR] Initializing SQLite database at $DB_FILE..."
        touch "$DB_FILE"
    fi
    chown -R www-data:www-data "$(dirname "$DB_FILE")"
    chmod -R 775 "$(dirname "$DB_FILE")"
    chmod 664 "$DB_FILE" 2>/dev/null || true
fi

# Set proper permissions for Laravel writable directories
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Generate app key if missing
if [ -z "$APP_KEY" ]; then
    echo "[MTC-GEAR] Generating application key..."
    php artisan key:generate --force
fi

# Run database migrations and seeds
echo "[MTC-GEAR] Running database migrations and seeders..."
php artisan migrate --force --seed

# Optimize Laravel caches for production
echo "[MTC-GEAR] Caching Laravel configuration and routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Apache web server in foreground
echo "[MTC-GEAR] Launching Apache web server..."
exec apache2-foreground
