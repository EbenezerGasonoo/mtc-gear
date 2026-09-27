const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8085;

// Data Paths
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const DEFAULT_CONFIG_FILE = path.join(DATA_DIR, 'default-config.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize config if missing
if (!fs.existsSync(CONFIG_FILE)) {
    if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
        fs.copyFileSync(DEFAULT_CONFIG_FILE, CONFIG_FILE);
    } else {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ general: {}, services: [] }, null, 2));
    }
}

// Initialize admin credentials if missing
if (!fs.existsSync(AUTH_FILE)) {
    const initialPass = process.env.ADMIN_PASSWORD || 'mtcadmin2026';
    const hash = bcrypt.hashSync(initialPass, 10);
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash: hash }, null, 2));
    console.log(`[MTC-PORTAL] Initialized admin credentials. Default password: ${initialPass}`);
}

// Helper to read config
function readConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error reading config:', e);
        return { general: {}, services: [] };
    }
}

// Helper to write config
function writeConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// Middlewares
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(
    cookieSession({
        name: 'mtc_portal_session',
        keys: [process.env.SESSION_SECRET || 'mtc-secret-key-production-portal-2026'],
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: 'lax',
    })
);

// Serve static views
app.use(express.static(path.join(__dirname, 'public')));

// Authentication check middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
}

// Public API: Get current config
app.get('/api/config', (req, res) => {
    const config = readConfig();
    res.json({ success: true, data: config });
});

// Auth Status
app.get('/api/auth-status', (req, res) => {
    res.json({ authenticated: Boolean(req.session && req.session.isAdmin) });
});

// Admin Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    try {
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
        const match = bcrypt.compareSync(password, authData.passwordHash);

        if (match) {
            req.session.isAdmin = true;
            return res.json({ success: true, message: 'Authenticated successfully' });
        } else {
            return res.status(401).json({ success: false, message: 'Incorrect admin password' });
        }
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ success: false, message: 'Server authentication error' });
    }
});

// Admin Logout
app.post('/api/logout', (req, res) => {
    req.session = null;
    res.json({ success: true, message: 'Logged out successfully' });
});

// Update Full Config (Protected)
app.put('/api/config', requireAuth, (req, res) => {
    const newConfig = req.body;
    if (!newConfig || !newConfig.general || !Array.isArray(newConfig.services)) {
        return res.status(400).json({ success: false, message: 'Invalid configuration payload' });
    }

    try {
        writeConfig(newConfig);
        res.json({ success: true, message: 'Portal configuration updated successfully', data: newConfig });
    } catch (e) {
        console.error('Error writing config:', e);
        res.status(500).json({ success: false, message: 'Failed to save configuration' });
    }
});

// Upload Custom Brand Logo (Protected)
app.post('/api/upload-logo', requireAuth, (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    try {
        const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, message: 'Invalid image format. Expected data URL.' });
        }

        const rawExt = matches[1].toLowerCase();
        const ext = rawExt === 'svg+xml' ? 'svg' : rawExt === 'jpeg' ? 'jpg' : rawExt;
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `brand-logo.${ext}`;
        const filePath = path.join(DATA_DIR, filename);

        // Remove old logo files if they have different extensions
        ['brand-logo.png', 'brand-logo.svg', 'brand-logo.jpg', 'brand-logo.jpeg', 'brand-logo.webp'].forEach(f => {
            const p = path.join(DATA_DIR, f);
            if (fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (e) {}
            }
        });

        fs.writeFileSync(filePath, buffer);

        const config = readConfig();
        const logoUrl = `/api/logo?t=${Date.now()}`;
        config.general = config.general || {};
        config.general.logoUrl = logoUrl;
        writeConfig(config);

        res.json({ success: true, logoUrl, message: 'Logo uploaded and set successfully!' });
    } catch (e) {
        console.error('Logo upload error:', e);
        res.status(500).json({ success: false, message: 'Failed to save logo image' });
    }
});

// Serve Brand Logo
app.get('/api/logo', (req, res) => {
    const candidates = ['brand-logo.png', 'brand-logo.svg', 'brand-logo.jpg', 'brand-logo.jpeg', 'brand-logo.webp'];
    for (const file of candidates) {
        const fullPath = path.join(DATA_DIR, file);
        if (fs.existsSync(fullPath)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.sendFile(fullPath);
        }
    }
    return res.status(404).send('No custom logo uploaded');
});

// Reset Logo to Default (Protected)
app.post('/api/reset-logo', requireAuth, (req, res) => {
    try {
        ['brand-logo.png', 'brand-logo.svg', 'brand-logo.jpg', 'brand-logo.jpeg', 'brand-logo.webp'].forEach(f => {
            const p = path.join(DATA_DIR, f);
            if (fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (e) {}
            }
        });

        const config = readConfig();
        config.general = config.general || {};
        config.general.logoUrl = '';
        writeConfig(config);

        res.json({ success: true, message: 'Reset to default MTC insignia successfully!' });
    } catch (e) {
        console.error('Reset logo error:', e);
        res.status(500).json({ success: false, message: 'Failed to reset logo' });
    }
});

// Change Admin Password (Protected)
app.post('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    try {
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
        const match = bcrypt.compareSync(currentPassword, authData.passwordHash);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash: newHash }, null, 2));
        res.json({ success: true, message: 'Admin password changed successfully' });
    } catch (e) {
        console.error('Change password error:', e);
        res.status(500).json({ success: false, message: 'Failed to update password' });
    }
});

// Ping a service URL to check status
app.get('/api/ping', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ alive: false, message: 'Target URL is required' });
    }
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(targetUrl, { signal: controller.signal, method: 'HEAD' });
        clearTimeout(timeout);
        res.json({ alive: response.ok || response.status < 500, status: response.status });
    } catch (e) {
        res.json({ alive: false, error: e.message });
    }
});

// HTML Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MTC-PORTAL] CMS Server listening on port ${PORT}`);
});
