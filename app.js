const state = {
    position: 0,
    target: 0,
    moving: 'idle',
    presets: [],
    online: false
};

const els = {
    positionValue: document.getElementById('positionValue'),
    targetValue: document.getElementById('targetValue'),
    moveState: document.getElementById('moveState'),
    range: document.getElementById('positionRange'),
    rangeValue: document.getElementById('rangeValue'),
    motionStatus: document.getElementById('motionStatus'),
    lastCommand: document.getElementById('lastCommand'),
    presetName: document.getElementById('presetName'),
    presetPosition: document.getElementById('presetPosition'),
    presetList: document.getElementById('presetList'),
    wifiSsid: document.getElementById('wifiSsid'),
    wifiRssi: document.getElementById('wifiRssi'),
    ipAddress: document.getElementById('ipAddress'),
    cloudState: document.getElementById('cloudState'),
    cloudLatency: document.getElementById('cloudLatency'),
    uptimeValue: document.getElementById('uptimeValue'),
    statusSsid: document.getElementById('statusSsid'),
    statusIp: document.getElementById('statusIp'),
    statusRssi: document.getElementById('statusRssi'),
    statusCloud: document.getElementById('statusCloud'),
    statusLatency: document.getElementById('statusLatency'),
    statusServer: document.getElementById('statusServer'),
    statusMotor: document.getElementById('statusMotor'),
    statusCurrent: document.getElementById('statusCurrent'),
    statusTemp: document.getElementById('statusTemp'),
    curtainVisual: document.getElementById('curtainVisual'),
    logList: document.getElementById('logList')
};

const api = {
    status: '/api/status',
    move: '/api/move',
    preset: '/api/preset',
    wifi: '/api/wifi',
    cloud: '/api/cloud',
    motor: '/api/motor',
    calibrate: '/api/calibrate'
};

const logEntries = [];

const menuToggle = document.getElementById('menuToggle');
const menuOverlay = document.getElementById('menuOverlay');
const mainNav = document.getElementById('mainNav');

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function setCurtainPosition(position) {
    const openHeight = `${100 - position}%`;
    els.curtainVisual.style.setProperty('--curtain-open', openHeight);
}

function setMovingState(moving) {
    const isMoving = moving === 'moving';
    els.curtainVisual.classList.toggle('is-moving', isMoving);
    els.motionStatus.textContent = isMoving ? 'Движется' : 'Остановлено';
    els.motionStatus.classList.toggle('is-active', isMoving);
}

function renderPresets() {
    els.presetList.innerHTML = '';
    if (!state.presets.length) {
        const empty = document.createElement('div');
        empty.className = 'preset-empty';
        empty.textContent = 'Пока нет сохраненных пресетов. Добавьте первый.';
        els.presetList.appendChild(empty);
        return;
    }
    state.presets.forEach((preset) => {
        const row = document.createElement('div');
        row.className = 'preset-item';
        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = preset.name;
        const value = document.createElement('div');
        value.className = 'muted';
        value.textContent = `${preset.position}%`;
        info.appendChild(title);
        info.appendChild(value);
        const go = document.createElement('button');
        go.className = 'btn btn-secondary';
        go.textContent = 'Применить';
        go.addEventListener('click', () => sendMove({ action: 'goto', position: preset.position }));
        row.appendChild(info);
        row.appendChild(go);
        els.presetList.appendChild(row);
    });
}

function updateStatus(data) {
    if (!data) {
        return;
    }
    const position = Number.isFinite(data.position) ? clamp(data.position, 0, 100) : state.position;
    const target = Number.isFinite(data.target) ? clamp(data.target, 0, 100) : state.target;
    state.position = position;
    state.target = target;
    state.moving = data.moving || state.moving;

    els.positionValue.textContent = `${position}%`;
    els.targetValue.textContent = `${target}%`;
    els.moveState.textContent = data.moving === 'moving' ? 'Движется' : 'Остановлено';
    els.range.value = position;
    els.rangeValue.textContent = `${position}%`;
    els.presetPosition.textContent = `${position}%`;

    setCurtainPosition(position);
    setMovingState(state.moving === 'moving' ? 'moving' : 'idle');

    if (data.wifi) {
        els.wifiSsid.textContent = data.wifi.ssid || '---';
        els.wifiRssi.textContent = `RSSI: ${data.wifi.rssi ?? '--'} dBm`;
        els.statusSsid.textContent = data.wifi.ssid || '---';
        els.statusRssi.textContent = `${data.wifi.rssi ?? '--'} dBm`;
    }
    if (data.ip) {
        els.ipAddress.textContent = data.ip;
        els.statusIp.textContent = data.ip;
    }
    if (data.uptime) {
        els.uptimeValue.textContent = `Uptime: ${data.uptime}`;
    }
    if (data.cloud) {
        els.cloudState.textContent = data.cloud.connected ? 'Online' : 'Offline';
        els.cloudLatency.textContent = `Latency: ${data.cloud.latency ?? '--'} ms`;
        els.statusCloud.textContent = data.cloud.connected ? 'Подключено' : 'Не в сети';
        els.statusLatency.textContent = `${data.cloud.latency ?? '--'} ms`;
        els.statusServer.textContent = data.cloud.server || '---';
    }
    if (data.motor) {
        els.statusMotor.textContent = data.motor.mode || '---';
        els.statusCurrent.textContent = `${data.motor.current ?? '--'} mA`;
        els.statusTemp.textContent = `${data.motor.temp ?? '--'} °C`;
    }
    if (Array.isArray(data.presets)) {
        state.presets = data.presets;
        savePresetsLocal();
        renderPresets();
    }
}

function addLog(message) {
    const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    logEntries.unshift(`[${ts}] ${message}`);
    if (logEntries.length > 8) {
        logEntries.pop();
    }
    els.logList.innerHTML = '';
    logEntries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'log-item';
        item.textContent = entry;
        els.logList.appendChild(item);
    });
}

function setOnline(online) {
    state.online = online;
    if (!online) {
        els.cloudState.textContent = '---';
        els.statusCloud.textContent = 'Не в сети';
        els.motionStatus.classList.add('is-warning');
    } else {
        els.motionStatus.classList.remove('is-warning');
    }
}

async function fetchStatus() {
    try {
        const response = await fetch(api.status, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Status error');
        }
        const data = await response.json();
        updateStatus(data);
        setOnline(true);
    } catch (error) {
        setOnline(false);
    }
}

async function sendMove(payload) {
    const body = {
        action: payload.action,
        position: payload.position ?? null
    };
    try {
        await fetch(api.move, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const actionLabels = {
            open: 'Открыть',
            close: 'Закрыть',
            stop: 'Стоп'
        };
        const label = payload.action === 'goto'
            ? `Позиция ${payload.position}%`
            : (actionLabels[payload.action] || payload.action);
        els.lastCommand.textContent = label;
        addLog(`Команда: ${label}`);
        fetchStatus();
    } catch (error) {
        addLog('Не удалось отправить команду');
    }
}

async function sendPreset(name) {
    const payload = { name, position: state.position };
    try {
        await fetch(api.preset, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        addLog(`Сохранен пресет: ${name}`);
        fetchStatus();
    } catch (error) {
        addLog('Не удалось сохранить на сервере, сохранено локально');
        const local = { name, position: state.position };
        state.presets.unshift(local);
        savePresetsLocal();
        renderPresets();
    }
}

async function sendForm(form, endpoint, label) {
    const data = Object.fromEntries(new FormData(form).entries());
    try {
        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        addLog(`Сохранены настройки: ${label}`);
    } catch (error) {
        addLog(`Не удалось сохранить настройки: ${label}`);
    }
}

async function sendCalibrate(action) {
    try {
        await fetch(api.calibrate, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        addLog(`Калибровка: ${action}`);
    } catch (error) {
        addLog('Не удалось отправить калибровку');
    }
}

function savePresetsLocal() {
    localStorage.setItem('shtora-presets', JSON.stringify(state.presets));
}

function loadPresetsLocal() {
    try {
        const raw = localStorage.getItem('shtora-presets');
        if (raw) {
            state.presets = JSON.parse(raw);
        }
    } catch (error) {
        state.presets = [];
    }
}

function bindEvents() {
    document.querySelectorAll('[data-move]').forEach((button) => {
        button.addEventListener('click', () => {
            sendMove({ action: button.dataset.move });
        });
    });

    document.querySelectorAll('[data-step]').forEach((button) => {
        button.addEventListener('click', () => {
            const step = Number(button.dataset.step);
            const next = clamp(state.position + step, 0, 100);
            sendMove({ action: 'goto', position: next });
        });
    });

    document.querySelectorAll('[data-calibrate]').forEach((button) => {
        button.addEventListener('click', () => {
            sendCalibrate(button.dataset.calibrate);
        });
    });

    document.getElementById('goToPosition').addEventListener('click', () => {
        const position = Number(els.range.value);
        sendMove({ action: 'goto', position });
    });

    els.range.addEventListener('input', () => {
        const value = Number(els.range.value);
        els.rangeValue.textContent = `${value}%`;
    });

    document.getElementById('savePreset').addEventListener('click', () => {
        const name = els.presetName.value.trim();
        if (!name) {
            addLog('Введите имя пресета');
            return;
        }
        sendPreset(name);
        els.presetName.value = '';
    });

    document.getElementById('wifiForm').addEventListener('submit', (event) => {
        event.preventDefault();
        sendForm(event.target, api.wifi, 'Wi-Fi');
    });

    document.getElementById('cloudForm').addEventListener('submit', (event) => {
        event.preventDefault();
        sendForm(event.target, api.cloud, 'Облако');
    });

    document.getElementById('motorForm').addEventListener('submit', (event) => {
        event.preventDefault();
        sendForm(event.target, api.motor, 'Мотор');
    });

    document.getElementById('clearLogs').addEventListener('click', () => {
        logEntries.length = 0;
        els.logList.innerHTML = '<div class="log-item">---</div>';
    });

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        mainNav.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    });

    menuOverlay.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        menuOverlay.classList.remove('active');
    });
}

function revealSections() {
    document.querySelectorAll('[data-reveal]').forEach((el, index) => {
        window.setTimeout(() => {
            el.classList.add('is-visible');
        }, 120 * index);
    });
}

loadPresetsLocal();
renderPresets();
bindEvents();
revealSections();
fetchStatus();
window.setInterval(fetchStatus, 4000);
