const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
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
let lastCpuSample = null;

function sampleCpu() {
    return os.cpus().map((core) => {
        const times = core.times;
        const total = Object.values(times).reduce((sum, value) => sum + value, 0);
        return { total, idle: times.idle };
    });
}

function getCpuUsage() {
    const current = sampleCpu();
    if (!lastCpuSample) {
        lastCpuSample = current;
        return {
            total: 0,
            cores: current.map(() => 0)
        };
    }
    const coreUsage = current.map((core, index) => {
        const prev = lastCpuSample[index] || core;
        const totalDelta = core.total - prev.total;
        const idleDelta = core.idle - prev.idle;
        if (totalDelta <= 0) {
            return 0;
        }
        return Math.round((1 - idleDelta / totalDelta) * 100);
    });
    lastCpuSample = current;
    const total = coreUsage.length
        ? Math.round(coreUsage.reduce((sum, value) => sum + value, 0) / coreUsage.length)
        : 0;
    return { total, cores: coreUsage };
}

function getDiskUsage(callback) {
    const hostRoot = process.env.HOST_ROOT || '/host';
    const target = fs.existsSync(hostRoot) ? hostRoot : '/';
    execFile('df', ['-kP', '-x', 'tmpfs', '-x', 'devtmpfs', '-x', 'overlay', target], (error, stdout) => {
        if (error) {
            callback([]);
            return;
        }
        const lines = stdout.trim().split('\n').slice(1);
        const disks = lines.map((line) => {
            const parts = line.split(/\s+/);
            if (parts.length < 6) {
                return null;
            }
            const total = Number(parts[1]) * 1024;
            const used = Number(parts[2]) * 1024;
            let mount = parts[5];
            if (mount.startsWith(hostRoot)) {
                mount = mount === hostRoot ? '/' : mount.slice(hostRoot.length) || '/';
            }
            return { name: mount, used, total, mount };
        }).filter(Boolean);
        callback(disks);
    });
}

function readThermals() {
    const base = '/sys/class/thermal';
    let zones = [];
    try {
        zones = fs.readdirSync(base).filter((name) => name.startsWith('thermal_zone'));
    } catch (error) {
        return [];
    }
    return zones.map((zone) => {
        const zonePath = path.join(base, zone);
        let type = zone;
        let temp = null;
        try {
            type = fs.readFileSync(path.join(zonePath, 'type'), 'utf8').trim();
        } catch (error) {
            // ignore
        }
        try {
            const raw = fs.readFileSync(path.join(zonePath, 'temp'), 'utf8').trim();
            const value = Number(raw);
            if (Number.isFinite(value)) {
                temp = value > 1000 ? value / 1000 : value;
            }
        } catch (error) {
            temp = null;
        }
        return { name: type, value: temp };
    }).filter((item) => Number.isFinite(item.value));
}

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

app.get('/api/metrics', (req, res) => {
    const cpu = getCpuUsage();
    const memory = {
        total: os.totalmem(),
        used: os.totalmem() - os.freemem()
    };
    getDiskUsage((disks) => {
        const temps = readThermals();
        res.json({ cpu, memory, disks, temps, ts: Date.now() });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phone server running on http://0.0.0.0:${PORT}`);
});
