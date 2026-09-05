#!/bin/bash
set -e

PORT=${PORT:-10000}
echo "[MTC-GEAR] Starting container with PORT: $PORT"

# Ensure Apache listens on port 80 AND the custom Render $PORT (e.g. 10000)
echo "Listen 80" > /etc/apache2/ports.conf
if [ "$PORT" != "80" ]; then
    echo "Listen $PORT" >> /etc/apache2/ports.conf
fi

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
fi

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

# Set permissions for Apache www-data AFTER migrations & cache generation
echo "[MTC-GEAR] Setting runtime directory permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
if [ -f "${DB_DATABASE:-/var/www/html/database/database.sqlite}" ]; then
    chmod 664 "${DB_DATABASE:-/var/www/html/database/database.sqlite}"
fi

# Start Apache web server in foreground
echo "[MTC-GEAR] Launching Apache web server on ports 80 and $PORT..."
exec apache2-foreground
