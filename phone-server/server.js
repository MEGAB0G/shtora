const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const crypto = require('crypto');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_PATH = path.join(__dirname, 'data.json');

app.set('trust proxy', 1);

const defaultState = {
    position: 0,
    target: 0,
    moving: 'idle',
    wifi: { ssid: '', rssi: null },
    ip: '',
    cloud: { connected: false, latency: null, server: '' },
    motor: { mode: 'idle', current: null, temp: null },
    presets: [],
    command: null
};

function loadState() {
    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        return { ...defaultState, ...JSON.parse(raw) };
    } catch (error) {
        return { ...defaultState };
    }
}

function saveState() {
    fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), 'utf8');
}

let state = loadState();

function setCommand(action, position) {
    state.command = {
        id: Date.now(),
        action,
        position: position ?? null,
        ts: new Date().toISOString(),
        acked: false
    };
    saveState();
}

app.use(express.json({ limit: '256kb' }));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Static is served by nginx (web container). API should not expose repo contents.

app.get('/api/status', (req, res) => {
    res.json(state);
});

function applyStatus(payload) {
    state = {
        ...state,
        position: payload.position ?? state.position,
        target: payload.target ?? state.target,
        moving: payload.moving ?? state.moving,
        wifi: payload.wifi ? { ...state.wifi, ...payload.wifi } : state.wifi,
        ip: payload.ip ?? state.ip,
        cloud: payload.cloud ? { ...state.cloud, ...payload.cloud } : state.cloud,
        motor: payload.motor ? { ...state.motor, ...payload.motor } : state.motor
    };
    saveState();
}

app.post('/api/status', (req, res) => {
    const payload = req.body || {};
    applyStatus(payload);
    res.json({ ok: true });
});

app.post('/api/move', (req, res) => {
    const action = req.body?.action || 'stop';
    const position = typeof req.body?.position === 'number' ? req.body.position : null;
    if (action === 'goto' && position !== null) {
        state.target = Math.max(0, Math.min(100, position));
        state.moving = 'moving';
    } else if (action === 'open') {
        state.target = 100;
        state.moving = 'moving';
    } else if (action === 'close') {
        state.target = 0;
        state.moving = 'moving';
    } else if (action === 'left-down-10' || action === 'right-down-10') {
        state.moving = 'moving';
    } else if (action === 'left-steps' || action === 'right-steps') {
        state.moving = 'moving';
    } else if (action === 'relay-off') {
        state.moving = 'idle';
    } else {
        state.moving = 'idle';
    }
    setCommand(action, position);
    res.json({ ok: true, command: state.command });
});

app.get('/api/command', (req, res) => {
    if (state.command && !state.command.acked) {
        res.json(state.command);
        return;
    }
    res.json({ id: null });
});

app.post('/api/command/ack', (req, res) => {
    const id = req.body?.id;
    if (state.command && state.command.id === id) {
        state.command.acked = true;
        saveState();
        res.json({ ok: true });
        return;
    }
    res.status(404).json({ ok: false });
});

// Single poll endpoint: ESP posts status and gets command back
app.post('/api/poll', (req, res) => {
    const payload = req.body || {};
    applyStatus(payload);
    if (state.command && !state.command.acked) {
        state.command.acked = true;
        saveState();
        res.json(state.command);
        return;
    }
    res.json({ id: 0 });
});

// GET poll for quick manual checks (does not change status)
app.get('/api/poll', (req, res) => {
    if (state.command && !state.command.acked) {
        res.json(state.command);
        return;
    }
    res.json({ id: 0 });
});

app.post('/api/preset', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const position = typeof req.body?.position === 'number' ? req.body.position : null;
    if (!name || position === null) {
        res.status(400).json({ ok: false });
        return;
    }
    const existing = state.presets.find((item) => item.name === name);
    if (existing) {
        existing.position = position;
    } else {
        state.presets.unshift({ name, position });
    }
    saveState();
    res.json({ ok: true });
});

app.post('/api/wifi', (req, res) => {
    state.wifi = { ...state.wifi, ...req.body };
    saveState();
    res.json({ ok: true });
});

app.post('/api/cloud', (req, res) => {
    state.cloud = { ...state.cloud, ...req.body };
    saveState();
    res.json({ ok: true });
});

app.post('/api/motor', (req, res) => {
    state.motor = { ...state.motor, ...req.body };
    saveState();
    res.json({ ok: true });
});

app.post('/api/calibrate', (req, res) => {
    const action = req.body?.action || 'start';
    state.motor = { ...state.motor, mode: `calibrate:${action}` };
    saveState();
    res.json({ ok: true });
});

const LIMIT_BYTES = 150 * 1024 * 1024 * 1024;
const USERS = ['oleg', 'rom', 'seno'];

function duBytes(target) {
    return new Promise((resolve) => {
        execFile('du', ['-sk', target], (error, stdout) => {
            if (error) {
                resolve(0);
                return;
            }
            const raw = stdout.trim().split(/\s+/)[0];
            const kb = Number(raw);
            if (!Number.isFinite(kb)) {
                resolve(0);
                return;
            }
            resolve(kb * 1024);
        });
    });
}

async function getUserUsage() {
    const raidBase = fs.existsSync('/srv/safe') ? '/srv/safe' : '/host-srv/safe';
    const trashBase = fs.existsSync('/exchange/trash') ? '/exchange/trash' : '/host-exchange/trash';

    const users = [];
    for (const user of USERS) {
        const raidPath = path.join(raidBase, user);
        const trashPath = path.join(trashBase, user);
        const [raidUsed, trashUsed] = await Promise.all([
            duBytes(raidPath),
            duBytes(trashPath)
        ]);
        users.push({
            name: user,
            raidUsed,
            trashUsed,
            limitBytes: LIMIT_BYTES
        });
    }
    return users;
}

app.get('/api/user-usage', async (req, res) => {
    try {
        const users = await getUserUsage();
        res.json({ users, limitBytes: LIMIT_BYTES, ts: Date.now() });
    } catch (error) {
        res.status(500).json({ users: [], limitBytes: LIMIT_BYTES, ts: Date.now() });
    }
});

// --------------------
// skarta (prototype API + file storage)
// --------------------

const SKARTA_DIR = process.env.SKARTA_DATA_DIR || path.join(__dirname, 'skarta-data');
const SKARTA_FILES = {
    users: path.join(SKARTA_DIR, 'users.json'),
    sessions: path.join(SKARTA_DIR, 'sessions.json'),
    experts: path.join(SKARTA_DIR, 'experts.json'),
    posts: path.join(SKARTA_DIR, 'posts.json'),
    reviews: path.join(SKARTA_DIR, 'reviews.json')
};

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath, fallback) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function atomicWriteJson(filePath, value) {
    ensureDir(path.dirname(filePath));
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmpPath, filePath);
}

function nowMs() {
    return Date.now();
}

function clampString(value, maxLen) {
    const s = String(value ?? '').trim();
    if (!s) return '';
    return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normalizeEmail(email) {
    return clampString(email, 254).toLowerCase();
}

function isValidEmail(email) {
    if (!email) return false;
    if (email.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseCsv(value, maxItems, itemMaxLen) {
    const raw = String(value ?? '');
    const parts = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s.length > itemMaxLen ? s.slice(0, itemMaxLen) : s));
    return parts.slice(0, maxItems);
}

function parseCookies(cookieHeader) {
    const out = {};
    if (!cookieHeader) return out;
    const parts = String(cookieHeader).split(';');
    for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (!key) continue;
        out[key] = decodeURIComponent(val);
    }
    return out;
}

function isHttps(req) {
    if (req.secure) return true;
    const proto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
    return proto === 'https';
}

function setSessionCookie(req, res, token, maxAgeSeconds) {
    const secure = isHttps(req);
    const attrs = [
        `skarta_session=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${maxAgeSeconds}`
    ];
    if (secure) attrs.push('Secure');
    res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(req, res) {
    const secure = isHttps(req);
    const attrs = ['skarta_session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
    if (secure) attrs.push('Secure');
    res.setHeader('Set-Cookie', attrs.join('; '));
}

function scryptHash(password, salt) {
    return crypto.scryptSync(password, salt, 64);
}

function safeEqual(a, b) {
    try {
        const ba = Buffer.from(a);
        const bb = Buffer.from(b);
        if (ba.length !== bb.length) return false;
        return crypto.timingSafeEqual(ba, bb);
    } catch {
        return false;
    }
}

const skartaStore = {
    users: readJsonFile(SKARTA_FILES.users, []),
    sessions: readJsonFile(SKARTA_FILES.sessions, {}),
    experts: readJsonFile(SKARTA_FILES.experts, []),
    posts: readJsonFile(SKARTA_FILES.posts, {}),
    reviews: readJsonFile(SKARTA_FILES.reviews, {})
};

// Seed a few demo experts if storage is empty (safe to delete later).
if (!Array.isArray(skartaStore.experts) || skartaStore.experts.length === 0) {
    skartaStore.experts = [
        {
            id: 'seed-fr-01',
            ownerUserId: 'seed',
            name: 'Claire D.',
            country: 'Франция',
            city: 'Paris',
            languages: ['Français', 'English', 'Русский'],
            topics: ['Еда', 'Безопасность', 'Транспорт'],
            price: 18,
            about: 'Живу в Париже 9 лет. Подскажу районы, где реально удобно жить туристу, как не попасть на туристические ловушки и где вкусно за разумные деньги.',
            avatar: '',
            createdAt: nowMs(),
            updatedAt: nowMs()
        },
        {
            id: 'seed-th-01',
            ownerUserId: 'seed',
            name: 'Nok S.',
            country: 'Таиланд',
            city: 'Bangkok / Phuket',
            languages: ['ไทย', 'English', 'Русский'],
            topics: ['Пляжи', 'Транспорт', 'Ночная жизнь'],
            price: 12,
            about: 'Помогаю составить маршрут, выбрать остров/пляж, объясню как с транспортом, симками и безопасностью. Без воды — только практика.',
            avatar: '',
            createdAt: nowMs(),
            updatedAt: nowMs()
        }
    ];
    atomicWriteJson(SKARTA_FILES.experts, skartaStore.experts);
}

function cleanupSessions() {
    const now = nowMs();
    let changed = false;
    for (const [token, sess] of Object.entries(skartaStore.sessions)) {
        if (!sess || typeof sess.expiresAt !== 'number' || sess.expiresAt <= now) {
            delete skartaStore.sessions[token];
            changed = true;
        }
    }
    if (changed) atomicWriteJson(SKARTA_FILES.sessions, skartaStore.sessions);
}

function toMe(user) {
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

function getAuthUser(req) {
    cleanupSessions();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.skarta_session;
    if (!token) return null;
    const sess = skartaStore.sessions[token];
    if (!sess) return null;
    if (typeof sess.expiresAt !== 'number' || sess.expiresAt <= nowMs()) return null;
    const user = skartaStore.users.find((u) => u.id === sess.userId) || null;
    return user;
}

function requireAuth(req, res, next) {
    const user = getAuthUser(req);
    if (!user) {
        res.status(401).json({ ok: false, error: 'unauthorized' });
        return;
    }
    req.skartaUser = user;
    next();
}

const authRate = new Map();
function authRateLimit(req, res, next) {
    const ip = String(req.ip || 'unknown');
    const now = nowMs();
    const windowMs = 60_000;
    const limit = 20;
    const row = authRate.get(ip) || { resetAt: now + windowMs, count: 0 };
    if (now > row.resetAt) {
        row.resetAt = now + windowMs;
        row.count = 0;
    }
    row.count += 1;
    authRate.set(ip, row);
    if (row.count > limit) {
        res.status(429).json({ ok: false, error: 'rate_limited' });
        return;
    }
    next();
}

function computeExpertRating(expertId) {
    const list = Array.isArray(skartaStore.reviews[expertId]) ? skartaStore.reviews[expertId] : [];
    if (list.length === 0) return { rating: 0, count: 0 };
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return { rating: sum / list.length, count: list.length };
}

function publicExpert(expert) {
    const ratingInfo = computeExpertRating(expert.id);
    return {
        id: expert.id,
        ownerUserId: expert.ownerUserId,
        name: expert.name,
        country: expert.country,
        city: expert.city,
        languages: expert.languages,
        topics: expert.topics,
        price: expert.price,
        about: expert.about,
        avatar: expert.avatar,
        createdAt: expert.createdAt,
        updatedAt: expert.updatedAt,
        rating: Number(ratingInfo.rating.toFixed(2)),
        reviewsCount: ratingInfo.count
    };
}

// Auth
app.get('/api/skarta/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
        res.status(401).json({ ok: false });
        return;
    }
    const expert = skartaStore.experts.find((e) => e.ownerUserId === user.id) || null;
    res.json({ ok: true, me: toMe(user), expertId: expert?.id || null });
});

app.post('/api/skarta/auth/register', authRateLimit, (req, res) => {
    const name = clampString(req.body?.name, 60);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!name) {
        res.status(400).json({ ok: false, error: 'name_required' });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(400).json({ ok: false, error: 'email_invalid' });
        return;
    }
    if (password.length < 8 || password.length > 72) {
        res.status(400).json({ ok: false, error: 'password_invalid' });
        return;
    }
    if (skartaStore.users.some((u) => u.email === email)) {
        res.status(409).json({ ok: false, error: 'email_exists' });
        return;
    }

    const salt = crypto.randomBytes(16);
    const hash = scryptHash(password, salt);
    const user = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordSalt: salt.toString('base64'),
        passwordHash: hash.toString('base64'),
        createdAt: nowMs()
    };
    skartaStore.users.unshift(user);
    atomicWriteJson(SKARTA_FILES.users, skartaStore.users);

    const token = crypto.randomBytes(32).toString('hex');
    const maxAgeSeconds = 60 * 60 * 24 * 30;
    skartaStore.sessions[token] = { userId: user.id, createdAt: nowMs(), expiresAt: nowMs() + maxAgeSeconds * 1000 };
    atomicWriteJson(SKARTA_FILES.sessions, skartaStore.sessions);
    setSessionCookie(req, res, token, maxAgeSeconds);

    res.json({ ok: true, me: toMe(user) });
});

app.post('/api/skarta/auth/login', authRateLimit, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!isValidEmail(email) || !password) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
    }

    const user = skartaStore.users.find((u) => u.email === email);
    if (!user) {
        res.status(401).json({ ok: false, error: 'invalid' });
        return;
    }

    const salt = Buffer.from(String(user.passwordSalt || ''), 'base64');
    const expected = Buffer.from(String(user.passwordHash || ''), 'base64');
    const got = scryptHash(password, salt);
    if (!safeEqual(expected, got)) {
        res.status(401).json({ ok: false, error: 'invalid' });
        return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const maxAgeSeconds = 60 * 60 * 24 * 30;
    skartaStore.sessions[token] = { userId: user.id, createdAt: nowMs(), expiresAt: nowMs() + maxAgeSeconds * 1000 };
    atomicWriteJson(SKARTA_FILES.sessions, skartaStore.sessions);
    setSessionCookie(req, res, token, maxAgeSeconds);

    res.json({ ok: true, me: toMe(user) });
});

app.post('/api/skarta/auth/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.skarta_session;
    if (token && skartaStore.sessions[token]) {
        delete skartaStore.sessions[token];
        atomicWriteJson(SKARTA_FILES.sessions, skartaStore.sessions);
    }
    clearSessionCookie(req, res);
    res.json({ ok: true });
});

// Experts
app.get('/api/skarta/experts', (req, res) => {
    const country = clampString(req.query?.country, 60);
    const query = clampString(req.query?.q, 80).toLowerCase();

    const list = skartaStore.experts
        .filter((e) => {
            if (country && e.country !== country) return false;
            if (query) {
                const blob = [e.name, e.country, e.city, ...(e.topics || []), ...(e.languages || []), e.about || '']
                    .join(' ')
                    .toLowerCase();
                if (!blob.includes(query)) return false;
            }
            return true;
        })
        .map(publicExpert)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    res.json({ ok: true, experts: list });
});

app.get('/api/skarta/experts/:id', (req, res) => {
    const id = String(req.params.id || '');
    const expert = skartaStore.experts.find((e) => e.id === id);
    if (!expert) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }
    res.json({ ok: true, expert: publicExpert(expert) });
});

app.post('/api/skarta/experts', requireAuth, (req, res) => {
    const user = req.skartaUser;

    const name = clampString(req.body?.name, 60);
    const country = clampString(req.body?.country, 60);
    const city = clampString(req.body?.city, 80);
    const about = clampString(req.body?.about, 1500);
    const price = Number(req.body?.price || 0);
    const languages = Array.isArray(req.body?.languages) ? req.body.languages : parseCsv(req.body?.languages, 10, 20);
    const topics = Array.isArray(req.body?.topics) ? req.body.topics : parseCsv(req.body?.topics, 12, 24);
    const avatar = clampString(req.body?.avatar, 220_000);

    if (!name || !country || !city || !about) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
    }
    if (!Number.isFinite(price) || price < 1 || price > 500) {
        res.status(400).json({ ok: false, error: 'price_invalid' });
        return;
    }
    if (avatar && !avatar.startsWith('data:image/')) {
        res.status(400).json({ ok: false, error: 'avatar_invalid' });
        return;
    }

    let expert = skartaStore.experts.find((e) => e.ownerUserId === user.id) || null;
    if (!expert) {
        expert = {
            id: crypto.randomUUID(),
            ownerUserId: user.id,
            name,
            country,
            city,
            languages,
            topics,
            price,
            about,
            avatar: avatar || '',
            createdAt: nowMs(),
            updatedAt: nowMs()
        };
        skartaStore.experts.unshift(expert);
    } else {
        expert.name = name;
        expert.country = country;
        expert.city = city;
        expert.languages = languages;
        expert.topics = topics;
        expert.price = price;
        expert.about = about;
        if (avatar) expert.avatar = avatar;
        expert.updatedAt = nowMs();
    }

    atomicWriteJson(SKARTA_FILES.experts, skartaStore.experts);
    res.json({ ok: true, expert: publicExpert(expert) });
});

function requireExpertOwner(req, res, next) {
    const user = getAuthUser(req);
    if (!user) {
        res.status(401).json({ ok: false, error: 'unauthorized' });
        return;
    }
    const expertId = String(req.params.id || '');
    const expert = skartaStore.experts.find((e) => e.id === expertId);
    if (!expert) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }
    if (expert.ownerUserId !== user.id) {
        res.status(403).json({ ok: false, error: 'forbidden' });
        return;
    }
    req.skartaUser = user;
    req.skartaExpert = expert;
    next();
}

// Posts
app.get('/api/skarta/experts/:id/posts', (req, res) => {
    const expertId = String(req.params.id || '');
    const list = Array.isArray(skartaStore.posts[expertId]) ? skartaStore.posts[expertId] : [];
    res.json({ ok: true, posts: list });
});

app.post('/api/skarta/experts/:id/posts', requireExpertOwner, (req, res) => {
    const expertId = req.skartaExpert.id;
    const title = clampString(req.body?.title, 120);
    const body = clampString(req.body?.body, 5000);
    if (!title || !body) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
    }
    const list = Array.isArray(skartaStore.posts[expertId]) ? skartaStore.posts[expertId] : [];
    const post = { id: crypto.randomUUID(), title, body, createdAt: nowMs() };
    list.unshift(post);
    skartaStore.posts[expertId] = list.slice(0, 200);
    atomicWriteJson(SKARTA_FILES.posts, skartaStore.posts);
    res.json({ ok: true, post });
});

app.delete('/api/skarta/experts/:id/posts/:postId', requireExpertOwner, (req, res) => {
    const expertId = req.skartaExpert.id;
    const postId = String(req.params.postId || '');
    const list = Array.isArray(skartaStore.posts[expertId]) ? skartaStore.posts[expertId] : [];
    skartaStore.posts[expertId] = list.filter((p) => p.id !== postId);
    atomicWriteJson(SKARTA_FILES.posts, skartaStore.posts);
    res.json({ ok: true });
});

// Reviews
app.get('/api/skarta/experts/:id/reviews', (req, res) => {
    const expertId = String(req.params.id || '');
    const list = Array.isArray(skartaStore.reviews[expertId]) ? skartaStore.reviews[expertId] : [];
    res.json({ ok: true, reviews: list });
});

app.post('/api/skarta/experts/:id/reviews', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const expertId = String(req.params.id || '');
    const expert = skartaStore.experts.find((e) => e.id === expertId);
    if (!expert) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }

    const rating = Number(req.body?.rating || 0);
    const text = clampString(req.body?.text, 2000);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !text) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
    }

    const list = Array.isArray(skartaStore.reviews[expertId]) ? skartaStore.reviews[expertId] : [];
    const existing = list.find((r) => r.authorUserId === user.id);
    if (existing) {
        existing.rating = rating;
        existing.text = text;
        existing.updatedAt = nowMs();
    } else {
        list.unshift({
            id: crypto.randomUUID(),
            authorUserId: user.id,
            authorName: user.name,
            rating,
            text,
            createdAt: nowMs()
        });
    }
    skartaStore.reviews[expertId] = list.slice(0, 500);
    atomicWriteJson(SKARTA_FILES.reviews, skartaStore.reviews);

    res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phone server running on http://0.0.0.0:${PORT}`);
});
