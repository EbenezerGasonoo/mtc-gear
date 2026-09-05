# ==============================================================================
# Multi-stage Dockerfile for MTC GEAR on Render.com
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets (Vite + React 19 + Tailwind CSS)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY resources resources
COPY public public
COPY vite.config.js ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: PHP 8.2 + Apache Application Runtime
# ------------------------------------------------------------------------------
FROM php:8.2-apache

# Install system dependencies & PHP extension libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libsqlite3-dev \
    libpq-dev \
    zip \
    unzip \
    && docker-php-ext-install \
        pdo \
        pdo_sqlite \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
    && a2enmod rewrite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer from official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Apache configuration
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Copy Composer manifests
COPY composer.json composer.lock ./

# Install PHP dependencies without dev packages or scripts yet
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application codebase
COPY . .
RUN cp .env.example .env

# Copy compiled frontend assets from Stage 1 into public/build
COPY --from=frontend-builder /app/public/build ./public/build

# Finish Composer autoloader generation
RUN composer dump-autoload --optimize --no-dev

# Setup entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set directory permissions for Laravel runtime
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

EXPOSE 80 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
