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

# Ensure SQLite database file exists
DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
if [ ! -f "$DB_FILE" ]; then
    echo "[MTC-GEAR] Initializing SQLite database at $DB_FILE..."
    touch "$DB_FILE"
fi

# Ensure .env file exists so artisan commands (like key:generate) succeed
if [ ! -f /var/www/html/.env ]; then
    echo "[MTC-GEAR] Creating production .env from template..."
    if [ -f /var/www/html/.env.example ]; then
        cp /var/www/html/.env.example /var/www/html/.env
    else
        touch /var/www/html/.env
    fi
fi

# Configure SQLite in .env
sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' /var/www/html/.env 2>/dev/null || true
sed -i 's|^DB_DATABASE=.*|DB_DATABASE=/var/www/html/database/database.sqlite|' /var/www/html/.env 2>/dev/null || true
sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=file/' /var/www/html/.env 2>/dev/null || true
sed -i 's/^CACHE_STORE=.*/CACHE_STORE=file/' /var/www/html/.env 2>/dev/null || true
sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=sync/' /var/www/html/.env 2>/dev/null || true

# Generate application key if missing or not base64
if ! grep -q "^APP_KEY=base64:" /var/www/html/.env 2>/dev/null; then
    echo "[MTC-GEAR] Generating official Laravel base64 application key..."
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

# Set permissions for Apache www-data
echo "[MTC-GEAR] Setting runtime directory permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database /var/www/html/.env
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod 664 /var/www/html/.env "$DB_FILE" 2>/dev/null || true

# Start Apache web server in foreground
echo "[MTC-GEAR] Launching Apache web server on ports 80 and $PORT..."
exec apache2-foreground
