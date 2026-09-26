# MTC GEAR — NAS Hosting & Cloudflare Tunnel Guide
> **Mountain Top Communications (MTC)**  
> Production Equipment Inventory & Deployment Suite running on your local NAS alongside **MTC DAM**.

---

## 1. Architecture Overview

Both **MTC DAM** and **MTC GEAR** run side-by-side on your local NAS (Synology, TrueNAS, QNAP, or Unraid), powered by Docker and published securely to the web through your existing **Cloudflare Tunnel**:

```
                              [ Cloudflare Edge ]
                       (SSL / DDoS Shield / Anycast CDN)
                                 │            │
             https://dam.mtc-network.space    https://gear.mtc-network.space
                                 │            │
                                 ▼            ▼
                   ┌───────────────────────────────────┐
                   │   Cloudflare Tunnel (cloudflared)  │
                   │         Running on your NAS       │
                   └─────────────────┬─────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             │                                               │
             ▼ (Port 3000)                                   ▼ (Port 8080)
   ┌───────────────────┐                           ┌───────────────────┐
   │      MTC DAM      │                           │     MTC GEAR      │
   │  Next.js + Prisma │                           │  Laravel + React  │
   │  (Container: dam) │                           │  (Container: gear)│
   └───────────────────┘                           └───────────────────┘
```

* **No port forwarding required on your router.**
* **Your public IP is never exposed.**
* **Automatic Cloudflare SSL certificate.**
* **High speed local network access within the office via `<NAS-IP>:8080`.**

---

## 2. Deploying on Your NAS

### Method A: Docker Compose via SSH / Terminal (Quickest)

1. SSH into your NAS or open a terminal:
   ```bash
   cd /path/to/docker/storage
   git clone https://github.com/EbenezerGasonoo/mtc-gear.git
   cd mtc-gear
   ```

2. Start the container:
   ```bash
   docker compose up -d --build
   ```

3. Verify the container is running:
   ```bash
   docker compose ps
   ```
   You will see `mtc-gear` running on port `8080`.

4. Test locally in your browser on your office/home network:
   ```
   http://<YOUR-NAS-IP>:8080
   ```

---

### Method B: Synology NAS (Container Manager / Docker UI)

1. Open **File Station** on your Synology NAS.
2. Navigate to your `docker` folder and create a new directory: `mtc-gear`.
3. Upload the project files or clone the repository into `/docker/mtc-gear`.
4. Open **Container Manager**:
   - Go to **Project** → Click **Create**.
   - **Project Name**: `mtc-gear`
   - **Path**: `/docker/mtc-gear`
   - **Source**: Select *Use existing docker-compose.yml*.
   - Check *Start the project immediately after it is created*.
   - Click **Done**.
5. Synology builds the image and launches MTC GEAR.
6. Test in your browser: `http://<SYNOLOGY-IP>:8080`.

---

### Method C: TrueNAS SCALE / QNAP / Unraid

* **TrueNAS SCALE**: Navigate to **Apps** → **Discover Apps** → **Custom App** (or use the TrueNAS Dockge / Portainer tool), paste the [docker-compose.yml](file:///i:/Projects/Inventory%20Check-in/docker-compose.yml), and click Deploy.
* **QNAP**: Open **Container Station** → **Applications** → **Create** → Paste [docker-compose.yml](file:///i:/Projects/Inventory%20Check-in/docker-compose.yml).
* **Unraid**: Use the **Compose Manager** plugin to import and run the compose file.

---

## 3. Connect to Your Existing Cloudflare Tunnel

Since you already have `dam.mtc-network.space` running via Cloudflare Tunnel, you **do not need a new tunnel**! You simply add a second hostname to the existing tunnel.

### Step-by-Step in Cloudflare Dashboard:

1. Log in to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. In the left sidebar, navigate to **Networks** → **Tunnels**.
3. Click on your active NAS tunnel (the one currently routing `dam.mtc-network.space`) and click **Configure**.
4. Go to the **Public Hostnames** tab.
5. Click **Add a public hostname**:
   * **Subdomain**: `gear`
   * **Domain**: `mtc-network.space` (select from dropdown)
   * **Path**: *(leave empty)*
   * **Type**: `HTTP`
   * **URL**:
     * If the tunnel runs directly on the NAS host: `localhost:8080` (or `127.0.0.1:8080`)
     * If using host LAN IP: `<YOUR-NAS-IP>:8080`
     * If cloudflared is running in the same Docker network: `mtc-gear:80`
6. Click **Save hostname**.

---

## 4. Testing Your Live Production Site

Within 30 seconds of saving the hostname in Cloudflare:

1. Open your browser and navigate to:
   ```
   https://gear.mtc-network.space/
   ```
2. Log in with your default MTC administrator account:
   * **Email**: `admin@mtc.local`
   * **Password**: `Password123!`
   *(Be sure to update this password immediately in Settings after first login).*

---

## 5. Persistent Data & Backups

Your data is safely stored in persistent Docker volumes on the NAS:

* **Database (SQLite)**: Volume `mtc_gear_database` mapped to `/var/www/html/database`. Contains all equipment records, bookings, approvals, and user accounts.
* **Storage (Uploads)**: Volume `mtc_gear_storage` mapped to `/var/www/html/storage/app/public`. Contains uploaded asset photos, receipts, generated QR labels, and signatures.

### Automatic Backup Command
You can back up your database anytime from your NAS terminal:
```bash
docker exec mtc-gear cp /var/www/html/database/database.sqlite /var/www/html/database/backup_$(date +%Y%m%d).sqlite
```
