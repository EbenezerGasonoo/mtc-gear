# MTC GEAR — Equipment Inventory & Deployment Management System
> **Mountain Top Communications (MTC)**  
> Production Equipment Asset Tracking, Approval Workflows, Mobile Handover & Return Inspection Suite.

---

## 1. Product Overview

**MTC GEAR** is an enterprise-grade internal equipment inventory, request, approval, check-out, check-in, inspection, maintenance, and asset-tracking web application custom-built for **Mountain Top Communications (MTC)**. 

The system gives MTC complete visibility, custody tracking, and operational accountability over its camera bodies, cine lenses, audio packages, lighting rigs, aerial drones, stabilizers, power stations, and broadcast production assets.

### Core Capabilities

- **Equipment Registry & Asset Tags**: Full asset catalog with standardized ID formatting (`MTC-CAM-001`, `MTC-LEN-002`), serial numbers, purchase records, condition tracking, and asset documentation.
- **Dynamic QR Codes & Thermal Label Printing**: Instant high-contrast printable equipment labels containing embedded QR codes, asset IDs, serials, and category tags for studio labeling.
- **Integrated Mobile Camera Barcode/QR Scanner**: In-browser camera scanning powered by `html5-qrcode` for instant gear room lookup, check-outs, and returns on any smartphone or tablet.
- **Collision-Free Gear Reservation Engine**: Real-time interval date collision detection ($\max(S_1, S_2) \le \min(E_1, E_2)$) preventing overlapping gear reservations across projects.
- **Multi-Role Request & Approval Pipeline**: Crew members submit multi-item gear reservations; Gear Overseers review, approve, partially approve, reject, or request changes with mandatory explanatory notes.
- **Inspection Checklists & Digital Handover**: Mandatory pre-checkout verification (battery charge, SD card format, lens caps, mounts) and digital borrower signature token with timestamp and IP logging.
- **Automated Return Workflows & Restocking**: Post-deployment inspection checklist; automated asset state transition (`available`, `in_maintenance`, `damaged`, `lost`); automatic incident ticket generation upon damage/loss.
- **Maintenance & Incident Management**: Service scheduling, cost tracking, repair logs, severity-graded incident tickets (`low`, `medium`, `high`, `critical`), and automated asset restoration to the available vault.
- **Immutable Audit Trail**: Append-only audit logger capturing actor, action, timestamp, IP address, user-agent, and full before/after JSON state snapshots.
- **Executive Reporting & Live CSV Exports**: Utilization leaderboard, damage frequency, overdue tracking, maintenance expenditure, and one-click streaming CSV exports.

---

## 2. Technology Stack

- **Backend Framework**: [Laravel 12 / 11](https://laravel.com/) (PHP 8.2+)
- **Authentication & RBAC**: Laravel Sanctum API Tokens + Custom Role Middleware (`super_admin`, `gear_overseer`, `staff`, `viewer`)
- **Database**: MySQL 8.0 (Production) / SQLite (Local Zero-Config Dev)
- **Frontend Framework**: [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/) Single Page Application
- **Styling & Theme**: [Tailwind CSS v4](https://tailwindcss.com/) with Pan-African Obsidian, Warm Ochre Gold (`#F59E0B`), Slate Navy, and Terracotta accents
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Engine**: `qrcode` (SVG/Canvas rendering) + `html5-qrcode` (HTML5 camera video stream scanner)
- **Web Server Compatibility**: Apache 2.4+ (with `mod_rewrite`), Nginx, cPanel Shared Hosting, Linux VPS

---

## 3. Demo & Default Accounts

The database seeders generate realistic equipment, categories, locations, a turnkey documentary production kit, and four pre-configured accounts representing all system roles:

| Role | Email | Password | Department | Primary Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@mtc.local` | `Password123!` | Executive Management | Full administrative access, user creation, role assignment, system settings, immutable audit log view. |
| **Gear Overseer** | `overseer@mtc.local` | `Password123!` | Production Operations | Request approval/rejection, check-out issuance, return inspections, maintenance scheduling, incident logging. |
| **Staff / Crew** | `staff@mtc.local` | `Password123!` | Cinematography & Field | Browse inventory, check real-time availability, submit requests, sign digital handover, view personal bookings. |
| **Viewer** | `viewer@mtc.local` | `Password123!` | Production Management | Read-only access to equipment catalog, deployment schedules, and inventory status reports. |

---

## 4. Local Development Quickstart

### Prerequisites
- PHP 8.2 or higher with extensions: `pdo_sqlite`, `pdo_mysql`, `mbstring`, `xml`, `ctype`, `curl`, `fileinfo`
- Composer 2.x
- Node.js 18+ and npm

### Setup Steps

1. **Clone or navigate to repository**:
   ```bash
   cd "i:/Projects/Inventory Check-in"
   ```

2. **Install PHP Dependencies**:
   ```bash
   composer install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Environment Configuration**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Run Migrations & Seeders**:
   ```bash
   php artisan migrate:fresh --seed
   ```

6. **Create Public Storage Symlink**:
   ```bash
   php artisan storage:link
   ```

7. **Compile Frontend Assets**:
   ```bash
   # Development hot-reload
   npm run dev

   # Or production compile
   npm run build
   ```

8. **Start Local PHP Server**:
   ```bash
   php artisan serve --port=8000
   ```
   Open your browser and navigate to: `http://127.0.0.1:8000`

---

## 5. Production Deployment Guide (Linux VPS / cPanel / Apache / MySQL 8.0)

MTC GEAR is engineered for standard Linux VPS environments as well as cPanel shared hosting running Apache and MySQL 8.0+.

### 5.1 Server Requirements
- **Operating System**: Ubuntu 22.04 / 24.04 LTS, AlmaLinux 9, Debian 12, or cPanel on CloudLinux
- **Web Server**: Apache 2.4+ (with `mod_rewrite` enabled) or Nginx
- **PHP**: PHP 8.2+ or 8.3+ with extensions:
  `BCMath`, `Ctype`, `cURL`, `DOM`, `Fileinfo`, `JSON`, `Mbstring`, `OpenSSL`, `PCRE`, `PDO`, `pdo_mysql`, `Tokenizer`, `XML`
- **Database**: MySQL 8.0+ or MariaDB 10.5+

---

### 5.2 Step-by-Step Deployment on cPanel

#### Step A: Application Placement
1. In cPanel **File Manager** or via SSH/SFTP, upload the project directory to your home folder:
   `/home/username/mtc-gear`
   *(Keeping the application code one level above `public_html` is strongly recommended for security).*

2. Point your cPanel domain document root to the application's `/public` folder:
   - For primary domain: In cPanel, modify the document root to `/public_html/public` or symlink `public_html` to `/home/username/mtc-gear/public`.
   - For subdomain (e.g. `gear.mountaintop.local`): In cPanel **Domains / Subdomains**, set the Document Root directly to:
     `/home/username/mtc-gear/public`

> **Note on Shared Hosting without DocumentRoot Control**: If your host forces everything into `/public_html`, upload the entire project into `/public_html`. The pre-configured root `.htaccess` included in this repository will automatically route all public HTTP traffic to the `public/` folder while blocking access to `.env`, `composer.json`, `storage/logs`, etc.

#### Step B: MySQL 8.0 Database Setup
1. In cPanel, open **MySQL Database Wizard**.
2. Create a new database: e.g. `mtc_gear_db`.
3. Create a dedicated user: e.g. `mtc_gear_user` with a strong password.
4. Grant **ALL PRIVILEGES** to the user on that database.

#### Step C: Configure `.env`
In `/home/username/mtc-gear/.env`, set:
```ini
APP_NAME="MTC Gear"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://gear.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mtc_gear_db
DB_USERNAME=mtc_gear_user
DB_PASSWORD="YourSecurePasswordHere"

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public

MAIL_MAILER=smtp
MAIL_HOST=mail.yourdomain.com
MAIL_PORT=587
MAIL_USERNAME=gear@yourdomain.com
MAIL_PASSWORD="YourEmailPassword"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="gear@yourdomain.com"
MAIL_FROM_NAME="MTC Gear"
```

#### Step D: Run Database Migrations & Seed
Via cPanel **Terminal** or SSH:
```bash
cd /home/username/mtc-gear
php artisan migrate --force --seed
php artisan storage:link
```

#### Step E: Set Correct File Permissions
```bash
chmod -R 775 storage bootstrap/cache
chown -R username:nobody storage bootstrap/cache
```

#### Step F: Build & Cache Optimizations
```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### 5.3 Cron Job & Task Scheduling

The system includes an automatic background scanner (`gear:check-overdue`) that monitors equipment return deadlines, transitions late deployments to `OVERDUE`, logs audit events, and broadcasts alerts to overseers.

In cPanel **Cron Jobs** (or server `crontab -e`), add the Laravel scheduler to run every minute:

```bash
* * * * * cd /home/username/mtc-gear && php artisan schedule:run >> /dev/null 2>&1
```

Or run the overdue checker directly every hour:
```bash
0 * * * * cd /home/username/mtc-gear && php artisan gear:check-overdue >> /dev/null 2>&1
```

---

### 5.4 Database Backup & Storage Disaster Recovery

#### Automated Daily MySQL Dump
Create a backup shell script `/home/username/backup-mtc-gear.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/username/backups/mtc-gear"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# 1. Backup MySQL Database
mysqldump -u mtc_gear_user -p'YourSecurePasswordHere' mtc_gear_db | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# 2. Backup Uploaded Gear Photos & Documents
tar -czf "$BACKUP_DIR/storage_$TIMESTAMP.tar.gz" -C /home/username/mtc-gear/storage/app/public .

# 3. Delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +30 -delete
```

Schedule it in cPanel Cron Jobs daily at 02:00 AM:
```bash
0 2 * * * /bin/bash /home/username/backup-mtc-gear.sh
```

#### Database Restoration
To restore from a backup file:
```bash
gunzip < /home/username/backups/mtc-gear/db_20260904_020000.sql.gz | mysql -u mtc_gear_user -p mtc_gear_db
```

---

## 6. RESTful API Architecture

MTC GEAR exposes 68 secured RESTful API endpoints under `/api`:

### Authentication & Profile
- `POST /api/login` — Authenticate and obtain Sanctum bearer token
- `POST /api/logout` — Revoke active token
- `GET /api/me` — Get authenticated user details and active role
- `PUT /api/profile` — Update account profile and change password

### Dashboard & Analytics
- `GET /api/dashboard` — Unified operational KPI stats, alerts, upcoming returns, activity feed

### Equipment & Inventory
- `GET /api/assets` — Filtered asset registry (search, category, status, condition, location)
- `POST /api/assets` — Register new asset (with auto-generated ID)
- `GET /api/assets/{id}` — Asset details, history trail, maintenance and incident records
- `PUT /api/assets/{id}` — Update asset specs, status, condition, or location
- `DELETE /api/assets/{id}` — Soft/hard delete asset
- `POST /api/assets/{id}/photo` — Upload asset photo
- `GET /api/assets/preview-id` — Calculate next sequential asset ID for a category

### Categories & Locations
- `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}`
- `GET /api/locations`, `POST /api/locations`, `PUT /api/locations/{id}`, `DELETE /api/locations/{id}`

### Gear Kits (Bundles)
- `GET /api/gear-kits`, `POST /api/gear-kits`, `GET /api/gear-kits/{id}`, `PUT /api/gear-kits/{id}`, `DELETE /api/gear-kits/{id}`

### Gear Requests & Collision Detection
- `GET /api/gear-requests` — List user's or department's requests
- `POST /api/gear-requests` — Submit multi-item request with collision detection
- `GET /api/gear-requests/{id}` — Full request itemization and status
- `PUT /api/gear-requests/{id}` — Update request details
- `POST /api/gear-requests/{id}/approve` — Overseer approval (full)
- `POST /api/gear-requests/{id}/partially-approve` — Overseer partial item approval
- `POST /api/gear-requests/{id}/reject` — Overseer rejection with reason
- `POST /api/gear-requests/{id}/request-changes` — Request revisions from crew
- `POST /api/gear-requests/{id}/cancel` — Borrower cancellation
- `GET /api/gear-requests/check-availability` — Real-time interval collision tester

### Checkouts & Digital Signatures
- `GET /api/checkouts` — Active deployments list
- `POST /api/checkouts` — Issue checkout with pre-inspection checklist
- `GET /api/checkouts/{id}` — Detailed checkout status and item inspection details
- `POST /api/checkouts/{id}/sign` — Borrower digital signature handover acknowledgment

### Returns & Post-Deployment Inspections
- `GET /api/returns` — Return history and logs
- `POST /api/returns` — Process return, run inspection, transition asset state, generate incidents

### Maintenance & Service Logs
- `GET /api/maintenance`, `POST /api/maintenance`
- `GET /api/maintenance/{id}`, `PUT /api/maintenance/{id}`
- `POST /api/maintenance/{id}/complete` — Finish repair and return asset to `available`

### Incidents (Damage & Loss)
- `GET /api/incidents`, `POST /api/incidents`
- `GET /api/incidents/{id}`, `PUT /api/incidents/{id}`
- `POST /api/incidents/{id}/resolve` — Mark incident resolved

### Executive Reports & CSV Streams
- `GET /api/reports/inventory`
- `GET /api/reports/deployments`
- `GET /api/reports/overdue`
- `GET /api/reports/utilization`
- `GET /api/reports/maintenance`
- `GET /api/reports/damages`
- `GET /api/reports/export-csv` — Direct RFC 4180 streaming CSV download

### Administrative Controls
- `GET /api/audit-logs` — Immutable audit log query with actor and date filters
- `GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`
- `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`
- `GET /api/settings`, `POST /api/settings` — System branding and organization configuration

---

## 7. Quality Assurance & Automated Tests

A comprehensive PHPUnit / Pest feature test suite validates core business logic, RBAC security, date collision prevention, and the complete equipment deployment lifecycle.

### Running Tests
```bash
php artisan test
```

### Verified Test Cases
- `✓ user authentication and token issuance` — Validates Sanctum token authentication and invalid credential rejections.
- `✓ role based authorization restrictions` — Verifies staff users cannot perform overseer/admin actions (HTTP 403 Forbidden).
- `✓ asset registration and automatic id generation` — Verifies prefix-based formatting (`MTC-CAM-001`, `MTC-LEN-001`) and audit logging.
- `✓ realtime date collision and availability service` — Asserts that overlapping date reservations are flagged as unavailable while non-overlapping dates succeed.
- `✓ complete end to end lifecycle workflow` — Tests full flow: Asset creation $\to$ Request submission $\to$ Approval $\to$ Pre-inspection $\to$ Handover checkout $\to$ Digital signature $\to$ Post-return inspection $\to$ Automated vault restock.
- `✓ overdue scan command` — Verifies that `gear:check-overdue` flags past-due checkouts, updates requests, logs audit events, and issues notices.

---

## 8. License & Ownership

Confidential and proprietary software developed for **Mountain Top Communications (MTC)**. All rights reserved.
