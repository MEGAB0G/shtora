const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

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
    reviews: path.join(SKARTA_DIR, 'reviews.json'),
    chats: path.join(SKARTA_DIR, 'chats.json'),
    messages: path.join(SKARTA_DIR, 'messages.json'),
    media: path.join(SKARTA_DIR, 'media.json')
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
    reviews: readJsonFile(SKARTA_FILES.reviews, {}),
    chats: readJsonFile(SKARTA_FILES.chats, []),
    messages: readJsonFile(SKARTA_FILES.messages, {}),
    media: readJsonFile(SKARTA_FILES.media, {})
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

const SKARTA_UPLOADS_DIR = path.join(SKARTA_DIR, 'uploads');
ensureDir(SKARTA_UPLOADS_DIR);

function mediaExtFromMime(mime) {
    const m = String(mime || '').toLowerCase();
    if (m === 'image/jpeg') return '.jpg';
    if (m === 'image/png') return '.png';
    if (m === 'image/webp') return '.webp';
    if (m === 'image/gif') return '.gif';
    if (m === 'video/mp4') return '.mp4';
    if (m === 'video/webm') return '.webm';
    if (m === 'video/quicktime') return '.mov';
    return '';
}

function mediaKindFromMime(mime) {
    const m = String(mime || '').toLowerCase();
    if (m.startsWith('image/')) return 'image';
    if (m.startsWith('video/')) return 'video';
    return '';
}

function extractMediaIdFromUrl(url) {
    const s = String(url || '');
    const prefix = '/api/skarta/media/';
    if (!s.startsWith(prefix)) return '';
    const rest = s.slice(prefix.length);
    const id = rest.split(/[?#/]/)[0];
    return id || '';
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, SKARTA_UPLOADS_DIR),
        filename: (req, file, cb) => {
            try {
                const ext = mediaExtFromMime(file.mimetype);
                if (!ext) return cb(new Error('unsupported_type'));
                const id = req.skartaUploadId || crypto.randomUUID();
                req.skartaUploadId = id;
                cb(null, `${id}${ext}`);
            } catch (e) {
                cb(e);
            }
        }
    }),
    fileFilter: (req, file, cb) => {
        const kind = mediaKindFromMime(file.mimetype);
        if (!kind) return cb(new Error('unsupported_type'));
        if (!mediaExtFromMime(file.mimetype)) return cb(new Error('unsupported_type'));
        cb(null, true);
    },
    limits: {
        files: 1,
        fileSize: 30 * 1024 * 1024
    }
});

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

function expertOwnerOrNull(userId) {
    if (!userId) return null;
    return skartaStore.experts.find((e) => e.ownerUserId === userId) || null;
}

function saveChats() {
    atomicWriteJson(SKARTA_FILES.chats, skartaStore.chats);
    atomicWriteJson(SKARTA_FILES.messages, skartaStore.messages);
}

function listChatsForUser(user) {
    const mineExpert = expertOwnerOrNull(user.id);
    const out = [];
    for (const chat of skartaStore.chats || []) {
        if (!chat) continue;
        const isUserSide = chat.userId === user.id;
        const isExpertSide = mineExpert && chat.expertId === mineExpert.id;
        if (!isUserSide && !isExpertSide) continue;
        out.push(chat);
    }
    return { mineExpert, chats: out };
}

function getChatById(chatId) {
    return (skartaStore.chats || []).find((c) => c.id === chatId) || null;
}

function canAccessChat(user, chat) {
    if (!user || !chat) return false;
    if (chat.userId === user.id) return true;
    const mineExpert = expertOwnerOrNull(user.id);
    if (mineExpert && chat.expertId === mineExpert.id) return true;
    return false;
}

function whichChatSide(user, chat) {
    if (!user || !chat) return '';
    if (chat.userId === user.id) return 'user';
    const mineExpert = expertOwnerOrNull(user.id);
    if (mineExpert && mineExpert.id === chat.expertId) return 'expert';
    return '';
}

function lastReadForSide(chat, side) {
    if (!chat) return 0;
    if (side === 'user') return Number(chat.lastReadUserAt || 0);
    if (side === 'expert') return Number(chat.lastReadExpertAt || 0);
    return 0;
}

function setLastReadForSide(chat, side, ts) {
    if (!chat) return;
    const safeTs = Number.isFinite(Number(ts)) ? Number(ts) : nowMs();
    if (side === 'user') chat.lastReadUserAt = safeTs;
    if (side === 'expert') chat.lastReadExpertAt = safeTs;
}

function isChatUnreadFor(user, chat) {
    const side = whichChatSide(user, chat);
    if (!side) return false;
    const list = Array.isArray(skartaStore.messages[chat.id]) ? skartaStore.messages[chat.id] : [];
    const last = list[0] || null;
    if (!last || typeof last.createdAt !== 'number') return false;
    const lastFrom = String(last.from || '');
    const readAt = lastReadForSide(chat, side);
    const fromOther = (side === 'user' && lastFrom === 'expert') || (side === 'expert' && lastFrom === 'user');
    return fromOther && last.createdAt > readAt;
}

// Media upload + serve (stored on /data volume)
app.post('/api/skarta/media', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const scope = clampString(req.query?.scope, 20) || 'public';
    const chatId = clampString(req.query?.chatId, 80);

    if (scope !== 'public' && scope !== 'chat') {
        res.status(400).json({ ok: false, error: 'scope_invalid' });
        return;
    }
    if (scope === 'chat') {
        const chat = getChatById(chatId);
        if (!chat) {
            res.status(404).json({ ok: false, error: 'chat_not_found' });
            return;
        }
        if (!canAccessChat(user, chat)) {
            res.status(403).json({ ok: false, error: 'forbidden' });
            return;
        }
    }

    req.skartaUploadId = crypto.randomUUID();
    upload.single('file')(req, res, (err) => {
        if (err) {
            const msg = String(err.message || '');
            const code = err.code === 'LIMIT_FILE_SIZE' ? 'too_large' : msg || 'upload_failed';
            res.status(400).json({ ok: false, error: code });
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json({ ok: false, error: 'file_required' });
            return;
        }

        const id = String(req.skartaUploadId || '');
        const mime = String(file.mimetype || '').toLowerCase();
        const ext = mediaExtFromMime(mime);
        const kind = mediaKindFromMime(mime);
        if (!id || !ext || !kind) {
            try {
                fs.unlinkSync(file.path);
            } catch {}
            res.status(400).json({ ok: false, error: 'unsupported_type' });
            return;
        }

        const meta = {
            id,
            ownerUserId: user.id,
            scope,
            chatId: scope === 'chat' ? chatId : '',
            kind,
            mime,
            ext,
            size: Number(file.size || 0),
            createdAt: nowMs()
        };
        skartaStore.media[id] = meta;
        atomicWriteJson(SKARTA_FILES.media, skartaStore.media);

        res.json({
            ok: true,
            media: { id, url: `/api/skarta/media/${id}`, kind, mime, size: meta.size, scope }
        });
    });
});

app.get('/api/skarta/media/:id', (req, res) => {
    const id = String(req.params.id || '');
    const meta = skartaStore.media[id] || null;
    if (!meta) {
        res.status(404).end('not_found');
        return;
    }
    if (meta.scope === 'chat') {
        const user = getAuthUser(req);
        const chat = getChatById(String(meta.chatId || ''));
        if (!user || !chat || !canAccessChat(user, chat)) {
            res.status(403).end('forbidden');
            return;
        }
    }

    const filePath = path.join(SKARTA_UPLOADS_DIR, `${id}${String(meta.ext || '')}`);
    if (!fs.existsSync(filePath)) {
        res.status(404).end('not_found');
        return;
    }
    res.setHeader('Content-Type', String(meta.mime || 'application/octet-stream'));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', meta.scope === 'public' ? 'public, max-age=31536000, immutable' : 'private, max-age=60');
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.status(500).end('error'));
    stream.pipe(res);
});

// Auth
app.get('/api/skarta/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
        res.status(401).json({ ok: false });
        return;
    }
    const expert = expertOwnerOrNull(user.id);
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

app.post('/api/skarta/me', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const name = clampString(req.body?.name, 60);
    if (!name) {
        res.status(400).json({ ok: false, error: 'name_required' });
        return;
    }
    const row = skartaStore.users.find((u) => u.id === user.id);
    if (!row) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }
    row.name = name;
    atomicWriteJson(SKARTA_FILES.users, skartaStore.users);
    res.json({ ok: true, me: toMe(row) });
});

app.post('/api/skarta/me/password', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!oldPassword || newPassword.length < 8 || newPassword.length > 72) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
    }

    const row = skartaStore.users.find((u) => u.id === user.id);
    if (!row) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }

    const salt = Buffer.from(String(row.passwordSalt || ''), 'base64');
    const expected = Buffer.from(String(row.passwordHash || ''), 'base64');
    const got = scryptHash(oldPassword, salt);
    if (!safeEqual(expected, got)) {
        res.status(401).json({ ok: false, error: 'invalid' });
        return;
    }

    const newSalt = crypto.randomBytes(16);
    const newHash = scryptHash(newPassword, newSalt);
    row.passwordSalt = newSalt.toString('base64');
    row.passwordHash = newHash.toString('base64');
    atomicWriteJson(SKARTA_FILES.users, skartaStore.users);

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

app.get('/api/skarta/experts-mine', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const expert = expertOwnerOrNull(user.id);
    if (!expert) {
        res.json({ ok: true, expert: null });
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
    if (avatar && !(avatar.startsWith('data:image/') || avatar.startsWith('/api/skarta/media/'))) {
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
    const rawAttachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    if (rawAttachments.length > 6) {
        res.status(400).json({ ok: false, error: 'attachments_too_many' });
        return;
    }

    const attachments = [];
    for (const a of rawAttachments) {
        const url = clampString(a?.url, 240);
        const caption = clampString(a?.caption, 140);
        if (!url) continue;
        const mediaId = extractMediaIdFromUrl(url);
        if (!mediaId) {
            res.status(400).json({ ok: false, error: 'attachment_invalid' });
            return;
        }
        const meta = skartaStore.media[mediaId] || null;
        if (!meta || meta.scope !== 'public' || meta.ownerUserId !== req.skartaUser.id) {
            res.status(400).json({ ok: false, error: 'attachment_forbidden' });
            return;
        }
        attachments.push({ id: meta.id, url: `/api/skarta/media/${meta.id}`, kind: meta.kind, mime: meta.mime, caption });
    }
    const list = Array.isArray(skartaStore.posts[expertId]) ? skartaStore.posts[expertId] : [];
    const post = { id: crypto.randomUUID(), title, body, attachments, createdAt: nowMs() };
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

// Feed (latest posts across all experts)
app.get('/api/skarta/feed', (req, res) => {
    const country = clampString(req.query?.country, 60);
    const query = clampString(req.query?.q, 120).toLowerCase();
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 60)));

    const expertsById = new Map(skartaStore.experts.map((e) => [e.id, e]));
    const items = [];

    for (const [expertId, posts] of Object.entries(skartaStore.posts || {})) {
        const expert = expertsById.get(expertId);
        if (!expert) continue;
        if (country && expert.country !== country) continue;
        const list = Array.isArray(posts) ? posts : [];
        for (const post of list) {
            const title = String(post?.title || '');
            const body = String(post?.body || '');
            if (query) {
                const blob = `${title} ${body} ${expert.name} ${expert.country} ${expert.city}`.toLowerCase();
                if (!blob.includes(query)) continue;
            }
            items.push({
                id: String(post.id || ''),
                createdAt: Number(post.createdAt || 0),
                title,
                body,
                attachments: Array.isArray(post.attachments) ? post.attachments : [],
                expert: publicExpert(expert)
            });
        }
    }

    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ ok: true, items: items.slice(0, limit) });
});

// Chats (user <-> expert messaging)
app.get('/api/skarta/unread', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const { chats } = listChatsForUser(user);
    let unreadChats = 0;
    for (const c of chats) {
        if (isChatUnreadFor(user, c)) unreadChats += 1;
    }
    res.json({ ok: true, unreadChats });
});

app.get('/api/skarta/chats', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const { chats } = listChatsForUser(user);

    const expertsById = new Map(skartaStore.experts.map((e) => [e.id, e]));
    const items = chats
        .map((c) => {
            const expert = expertsById.get(c.expertId);
            const messages = Array.isArray(skartaStore.messages[c.id]) ? skartaStore.messages[c.id] : [];
            const last = messages[0] || null;
            return {
                id: c.id,
                expert: expert ? publicExpert(expert) : null,
                userId: c.userId,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                lastMessage: last
                    ? {
                        text: String(last.text || ''),
                        createdAt: last.createdAt,
                        from: last.from,
                        hasMedia: Array.isArray(last.attachments) && last.attachments.length > 0
                    }
                    : null
                ,
                unread: isChatUnreadFor(user, c)
            };
        })
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    res.json({ ok: true, chats: items });
});

app.post('/api/skarta/chats', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const expertId = String(req.body?.expertId || '');
    const expert = skartaStore.experts.find((e) => e.id === expertId) || null;
    if (!expert) {
        res.status(404).json({ ok: false, error: 'expert_not_found' });
        return;
    }
    if (expert.ownerUserId === user.id) {
        res.status(400).json({ ok: false, error: 'cannot_chat_self' });
        return;
    }

    let chat = (skartaStore.chats || []).find((c) => c.expertId === expertId && c.userId === user.id) || null;
    if (!chat) {
        chat = {
            id: crypto.randomUUID(),
            expertId,
            userId: user.id,
            createdAt: nowMs(),
            updatedAt: nowMs(),
            lastReadUserAt: nowMs(),
            lastReadExpertAt: 0
        };
        skartaStore.chats.unshift(chat);
        skartaStore.messages[chat.id] = [];
        saveChats();
    }
    res.json({ ok: true, chatId: chat.id });
});

app.get('/api/skarta/chats/:id', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const chatId = String(req.params.id || '');
    const chat = getChatById(chatId);
    if (!chat) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }
    if (!canAccessChat(user, chat)) {
        res.status(403).json({ ok: false, error: 'forbidden' });
        return;
    }

    const side = whichChatSide(user, chat);
    if (side) {
        setLastReadForSide(chat, side, nowMs());
        chat.updatedAt = nowMs();
        saveChats();
    }

    const expert = skartaStore.experts.find((e) => e.id === chat.expertId) || null;
    const messages = Array.isArray(skartaStore.messages[chat.id]) ? skartaStore.messages[chat.id] : [];
    res.json({
        ok: true,
        chat: { id: chat.id, expert: expert ? publicExpert(expert) : null, userId: chat.userId, createdAt: chat.createdAt, updatedAt: chat.updatedAt },
        messages: messages.slice(0, 500)
    });
});

app.post('/api/skarta/chats/:id/messages', requireAuth, (req, res) => {
    const user = req.skartaUser;
    const chatId = String(req.params.id || '');
    const chat = getChatById(chatId);
    if (!chat) {
        res.status(404).json({ ok: false, error: 'not_found' });
        return;
    }
    if (!canAccessChat(user, chat)) {
        res.status(403).json({ ok: false, error: 'forbidden' });
        return;
    }

    const text = clampString(req.body?.text, 4000);
    const rawAttachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    if (!text && rawAttachments.length === 0) {
        res.status(400).json({ ok: false, error: 'message_required' });
        return;
    }
    if (rawAttachments.length > 6) {
        res.status(400).json({ ok: false, error: 'attachments_too_many' });
        return;
    }

    let from = 'user';
    if (chat.userId !== user.id) {
        const mineExpert = expertOwnerOrNull(user.id);
        if (mineExpert && mineExpert.id === chat.expertId) from = 'expert';
        else {
            res.status(403).json({ ok: false, error: 'forbidden' });
            return;
        }
    }

    const attachments = [];
    for (const a of rawAttachments) {
        const url = clampString(a?.url, 240);
        const caption = clampString(a?.caption, 140);
        if (!url) continue;
        const mediaId = extractMediaIdFromUrl(url);
        if (!mediaId) {
            res.status(400).json({ ok: false, error: 'attachment_invalid' });
            return;
        }
        const meta = skartaStore.media[mediaId] || null;
        if (!meta || meta.scope !== 'chat' || meta.chatId !== chat.id || meta.ownerUserId !== user.id) {
            res.status(400).json({ ok: false, error: 'attachment_forbidden' });
            return;
        }
        attachments.push({ id: meta.id, url: `/api/skarta/media/${meta.id}`, kind: meta.kind, mime: meta.mime, caption });
    }

    const list = Array.isArray(skartaStore.messages[chat.id]) ? skartaStore.messages[chat.id] : [];
    const msg = { id: crypto.randomUUID(), from, text, attachments, createdAt: nowMs() };
    list.unshift(msg);
    skartaStore.messages[chat.id] = list.slice(0, 2000);
    chat.updatedAt = nowMs();
    setLastReadForSide(chat, from, nowMs());
    saveChats();

    res.json({ ok: true, message: msg });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phone server running on http://0.0.0.0:${PORT}`);
});
