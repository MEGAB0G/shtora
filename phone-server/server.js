const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_PATH = path.join(__dirname, 'data.json');

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

app.use(express.static(path.join(__dirname, '..')));

app.get('/api/status', (req, res) => {
    res.json(state);
});

app.post('/api/status', (req, res) => {
    const payload = req.body || {};
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phone server running on http://0.0.0.0:${PORT}`);
});
