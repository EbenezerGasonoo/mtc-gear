# MTC Portal CMS — Management & Documentation
> **Mountain Top Communications (MTC)**  
> Content Management System for the Unified Landing Page at **`https://mtc-network.space/`**

---

## 1. Quick Access

* **Public Portal**: [https://mtc-network.space/](https://mtc-network.space/)
* **Admin CMS Dashboard**: [https://mtc-network.space/admin](https://mtc-network.space/admin)
* **Local LAN Admin**: `http://192.168.100.169:8085/admin`
* **Default Admin Password**: `mtcadmin2026`
  *(You can change this password at any time directly inside the **Admin Security** tab)*.

---

## 2. CMS Features & Capabilities

### 📱 Applications & Links Manager
* **Add Any Service**: Click **"+ Add New Application"** to add new tools, dashboards, client portals, or external links.
* **Edit Existing Cards**: Change Title, URL, Category badge, Description, Feature tags, or Port.
* **Color Themes**: Select from **Hunter Green**, **Warm Gold**, **Sky Blue**, **Royal Purple**, or **Rose Pink**.
* **Lucide Icons**: Choose from standard production icons (`camera`, `film`, `video`, `cloud`, `server`, `shield-check`, `folder-git-2`, `database`, `radio`, `layers`).
* **Reorder Cards**: Use the **↑** and **↓** buttons to arrange cards in your preferred order.
* **Show / Hide**: Toggle any card's visibility on or off without deleting it.

---

### 🎨 Portal & Hero Settings
* Change **Organization Name** (e.g. *Mountain Top Communications*).
* Change **Portal Title** (e.g. *Production Operations & Enterprise Portals*).
* Customize the **Hero Subtitle**.
* Update **System Status Badge Text** (e.g. *Systems Online*, *Scheduled Maintenance*).
* Show or hide the **Local Studio Host LAN Info Bar**.
* Update **Footer Copyright** and attribution details.

---

### 📢 Global Announcement Banner
* Toggle a banner that displays across the top of the portal.
* Choose between **Info (Blue)**, **Warning / Maintenance (Amber)**, **Emergency Alert (Red)**, or **Success (Green)**.
* Optionally attach a clickable link to the announcement.

---

### 🔐 Security & Password Management
* Update the Admin CMS password at any time under the **Admin Security** tab.
* Passwords are securely hashed with `bcrypt`.
* Sessions are encrypted with signed cookies.

---

## 3. Data Persistence
All settings and application records are automatically saved in the Docker persistent volume **`mtc_portal_data`** on your TrueNAS ZFS storage pool. Your edits will never be lost when restarting or updating containers.
