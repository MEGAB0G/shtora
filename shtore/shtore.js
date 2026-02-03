const els = {
    posValue: document.getElementById('posValue'),
    targetValue: document.getElementById('targetValue'),
    moveValue: document.getElementById('moveValue'),
    wifiValue: document.getElementById('wifiValue'),
    ipValue: document.getElementById('ipValue'),
    updatedValue: document.getElementById('updatedValue'),
    posSlider: document.getElementById('posSlider'),
    posInput: document.getElementById('posInput'),
    btnGoto: document.getElementById('btnGoto'),
    btnOpen: document.getElementById('btnOpen'),
    btnStop: document.getElementById('btnStop'),
    btnClose: document.getElementById('btnClose'),
    btnSavePreset: document.getElementById('btnSavePreset'),
    presetName: document.getElementById('presetName'),
    presetPos: document.getElementById('presetPos'),
    presetList: document.getElementById('presetList'),
    scheduleTime: document.getElementById('scheduleTime'),
    schedulePos: document.getElementById('schedulePos'),
    btnAddSchedule: document.getElementById('btnAddSchedule'),
    scheduleList: document.getElementById('scheduleList'),
    btnCalibStart: document.getElementById('btnCalibStart'),
    btnCalibStop: document.getElementById('btnCalibStop'),
    btnLeftDown10: document.getElementById('btnLeftDown10'),
    btnRightDown10: document.getElementById('btnRightDown10')
};

const API_BASE = '/api';
const SCHEDULE_KEY = 'shtoreSchedules';

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function formatPercent(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '--%';
    }
    return `${Math.round(value)}%`;
}

function updateStatus(data) {
    if (!data) {
        els.moveValue.textContent = 'offline';
        return;
    }
    els.posValue.textContent = formatPercent(data.position);
    els.targetValue.textContent = formatPercent(data.target);
    els.moveValue.textContent = data.moving || '--';
    els.wifiValue.textContent = data.wifi?.ssid ? `${data.wifi.ssid} (${data.wifi.rssi ?? '--'})` : '--';
    els.ipValue.textContent = data.ip || '--';
    els.updatedValue.textContent = new Date().toLocaleTimeString('ru-RU');

    if (Array.isArray(data.presets)) {
        renderPresets(data.presets);
    }
}

function renderPresets(presets) {
    els.presetList.innerHTML = '';
    if (!presets.length) {
        els.presetList.innerHTML = '<div class="muted">Пока нет пресетов</div>';
        return;
    }
    presets.forEach((preset) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const title = document.createElement('div');
        title.textContent = `${preset.name} — ${preset.position}%`;
        const actions = document.createElement('div');
        actions.className = 'list-actions';
        const btn = document.createElement('button');
        btn.className = 'btn ghost';
        btn.textContent = 'Запуск';
        btn.addEventListener('click', () => sendMove('goto', preset.position));
        actions.appendChild(btn);
        item.appendChild(title);
        item.appendChild(actions);
        els.presetList.appendChild(item);
    });
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    });
    if (!res.ok) {
        throw new Error('API error');
    }
    return res.json();
}

async function fetchStatus() {
    try {
        const res = await fetch(`${API_BASE}/status`, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error('Status error');
        }
        const data = await res.json();
        updateStatus(data);
    } catch (err) {
        updateStatus(null);
    }
}

async function sendMove(action, position) {
    try {
        await apiPost('/move', { action, position });
        await fetchStatus();
    } catch (err) {
        updateStatus(null);
    }
}

async function savePreset() {
    const name = els.presetName.value.trim();
    const position = clamp(Number(els.presetPos.value), 0, 100);
    if (!name || Number.isNaN(position)) {
        return;
    }
    try {
        await apiPost('/preset', { name, position });
        els.presetName.value = '';
        await fetchStatus();
    } catch (err) {
        updateStatus(null);
    }
}

async function calibrate(action) {
    try {
        await apiPost('/calibrate', { action });
        await fetchStatus();
    } catch (err) {
        updateStatus(null);
    }
}

function readSchedules() {
    try {
        return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]');
    } catch (err) {
        return [];
    }
}

function writeSchedules(items) {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(items));
}

function renderSchedules() {
    const items = readSchedules();
    els.scheduleList.innerHTML = '';
    if (!items.length) {
        els.scheduleList.innerHTML = '<div class="muted">Нет расписаний</div>';
        return;
    }
    items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'list-item';
        row.textContent = `${item.time} → ${item.position}%`;
        const actions = document.createElement('div');
        actions.className = 'list-actions';
        const btn = document.createElement('button');
        btn.className = 'btn ghost';
        btn.textContent = 'Удалить';
        btn.addEventListener('click', () => {
            const updated = readSchedules();
            updated.splice(idx, 1);
            writeSchedules(updated);
            renderSchedules();
        });
        actions.appendChild(btn);
        row.appendChild(actions);
        els.scheduleList.appendChild(row);
    });
}

function addSchedule() {
    const time = els.scheduleTime.value;
    const position = clamp(Number(els.schedulePos.value), 0, 100);
    if (!time || Number.isNaN(position)) {
        return;
    }
    const items = readSchedules();
    items.push({ time, position, lastRun: '' });
    writeSchedules(items);
    renderSchedules();
}

function tickSchedule() {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const today = now.toISOString().slice(0, 10);
    const items = readSchedules();
    let changed = false;
    items.forEach((item) => {
        if (item.time === time && item.lastRun !== today) {
            item.lastRun = today;
            changed = true;
            sendMove('goto', item.position);
        }
    });
    if (changed) {
        writeSchedules(items);
    }
}

els.posSlider.addEventListener('input', () => {
    els.posInput.value = els.posSlider.value;
});

els.posInput.addEventListener('input', () => {
    const value = clamp(Number(els.posInput.value), 0, 100);
    if (!Number.isNaN(value)) {
        els.posSlider.value = value;
    }
});

els.btnGoto.addEventListener('click', () => sendMove('goto', Number(els.posInput.value)));
els.btnOpen.addEventListener('click', () => sendMove('open'));
els.btnStop.addEventListener('click', () => sendMove('stop'));
els.btnClose.addEventListener('click', () => sendMove('close'));
els.btnSavePreset.addEventListener('click', savePreset);
els.btnAddSchedule.addEventListener('click', addSchedule);
els.btnCalibStart.addEventListener('click', () => calibrate('start'));
els.btnCalibStop.addEventListener('click', () => calibrate('stop'));
els.btnLeftDown10.addEventListener('click', () => sendMove('left-down-10'));
els.btnRightDown10.addEventListener('click', () => sendMove('right-down-10'));

renderSchedules();
fetchStatus();
setInterval(fetchStatus, 2000);
setInterval(tickSchedule, 20000);
