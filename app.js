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
    logList: document.getElementById('logList'),
    metricsState: document.getElementById('metricsState'),
    cpuTotal: document.getElementById('cpuTotal'),
    cpuTotalBar: document.getElementById('cpuTotalBar'),
    cpuCores: document.getElementById('cpuCores'),
    memUsed: document.getElementById('memUsed'),
    memTotal: document.getElementById('memTotal'),
    memBar: document.getElementById('memBar'),
    diskList: document.getElementById('diskList'),
    tempList: document.getElementById('tempList'),
    cpuChart: document.getElementById('cpuChart'),
    memChart: document.getElementById('memChart')
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
const metricsHistory = {
    cpu: [],
    mem: []
};

const menuToggle = document.getElementById('menuToggle');
const menuOverlay = document.getElementById('menuOverlay');
const mainNav = document.getElementById('mainNav');

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function formatBytes(value) {
    if (!Number.isFinite(value)) {
        return '--';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function pushHistory(list, value, max = 30) {
    if (!Number.isFinite(value)) {
        return;
    }
    list.push(value);
    if (list.length > max) {
        list.shift();
    }
}

function drawSparkline(canvas, values, color) {
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!values.length) {
        return;
    }

    const padding = 8;
    const width = rect.width - padding * 2;
    const height = rect.height - padding * 2;
    const maxValue = 100;

    ctx.beginPath();
    values.forEach((value, index) => {
        const x = padding + (width * index) / Math.max(values.length - 1, 1);
        const y = padding + height - (height * value) / maxValue;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    ctx.closePath();
    ctx.fillStyle = color.replace('1)', '0.12)');
    ctx.fill();
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

function setMetricsOffline() {
    els.metricsState.textContent = 'Нет данных';
    els.cpuTotal.textContent = '--%';
    els.cpuTotalBar.style.width = '0%';
    els.cpuCores.innerHTML = '<div class="muted">Нет данных по ядрам</div>';
    els.memUsed.textContent = '--';
    els.memTotal.textContent = 'Всего: --';
    els.memBar.style.width = '0%';
    els.diskList.innerHTML = '<div class="muted">Нет данных по дискам</div>';
    els.tempList.innerHTML = '<div class="muted">Нет данных по температурам</div>';
    drawSparkline(els.cpuChart, [], 'rgba(73, 194, 255, 1)');
    drawSparkline(els.memChart, [], 'rgba(246, 183, 60, 1)');
}

function updateMetrics(data) {
    if (!data) {
        setMetricsOffline();
        return;
    }

    const ts = data.ts ? new Date(data.ts) : new Date();
    const timeLabel = ts.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    els.metricsState.textContent = `Онлайн · ${timeLabel}`;

    const cpuTotal = data.cpu?.total ?? data.cpu?.usage;
    if (Number.isFinite(cpuTotal)) {
        const value = clamp(cpuTotal, 0, 100);
        els.cpuTotal.textContent = `${value.toFixed(0)}%`;
        els.cpuTotalBar.style.width = `${value}%`;
        pushHistory(metricsHistory.cpu, value);
    } else {
        els.cpuTotal.textContent = '--%';
        els.cpuTotalBar.style.width = '0%';
    }

    if (Array.isArray(data.cpu?.cores) && data.cpu.cores.length) {
        els.cpuCores.innerHTML = '';
        data.cpu.cores.forEach((coreValue, index) => {
            const value = Number.isFinite(coreValue) ? clamp(coreValue, 0, 100) : 0;
            const item = document.createElement('div');
            item.className = 'core-item';
            const label = document.createElement('span');
            label.textContent = `Ядро ${index + 1}`;
            const row = document.createElement('div');
            row.className = 'metric-row';
            const valueEl = document.createElement('strong');
            valueEl.textContent = `${value.toFixed(0)}%`;
            row.appendChild(label);
            row.appendChild(valueEl);
            const bar = document.createElement('div');
            bar.className = 'bar';
            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.width = `${value}%`;
            bar.appendChild(fill);
            item.appendChild(row);
            item.appendChild(bar);
            els.cpuCores.appendChild(item);
        });
    } else {
        els.cpuCores.innerHTML = '<div class="muted">Нет данных по ядрам</div>';
    }

    const memUsed = data.memory?.used;
    const memTotal = data.memory?.total;
    if (Number.isFinite(memUsed) && Number.isFinite(memTotal) && memTotal > 0) {
        const percent = clamp((memUsed / memTotal) * 100, 0, 100);
        els.memUsed.textContent = `${formatBytes(memUsed)} (${percent.toFixed(0)}%)`;
        els.memTotal.textContent = `Всего: ${formatBytes(memTotal)}`;
        els.memBar.style.width = `${percent}%`;
        pushHistory(metricsHistory.mem, percent);
    } else {
        els.memUsed.textContent = '--';
        els.memTotal.textContent = 'Всего: --';
        els.memBar.style.width = '0%';
    }

    if (Array.isArray(data.disks) && data.disks.length) {
        els.diskList.innerHTML = '';
        data.disks.forEach((disk) => {
            const used = Number.isFinite(disk.used) ? disk.used : null;
            const total = Number.isFinite(disk.total) ? disk.total : null;
            const percent = used !== null && total ? clamp((used / total) * 100, 0, 100) : null;
            const item = document.createElement('div');
            item.className = 'disk-item';
            const title = document.createElement('strong');
            title.textContent = disk.name || disk.mount || 'Диск';
            const summary = document.createElement('span');
            if (used !== null && total !== null) {
                summary.textContent = `${formatBytes(used)} из ${formatBytes(total)}`;
            } else {
                summary.textContent = 'Нет данных';
            }
            item.appendChild(title);
            item.appendChild(summary);
            if (percent !== null) {
                const bar = document.createElement('div');
                bar.className = 'bar';
                const fill = document.createElement('div');
                fill.className = 'bar-fill';
                fill.style.width = `${percent}%`;
                bar.appendChild(fill);
                item.appendChild(bar);
            }
            els.diskList.appendChild(item);
        });
    } else {
        els.diskList.innerHTML = '<div class="muted">Нет данных по дискам</div>';
    }

    if (Array.isArray(data.temps) && data.temps.length) {
        els.tempList.innerHTML = '';
        data.temps.forEach((temp) => {
            const item = document.createElement('div');
            const value = Number.isFinite(temp.value) ? temp.value : null;
            let heatClass = 'temp-cool';
            if (value !== null && value >= 75) {
                heatClass = 'temp-hot';
            } else if (value !== null && value >= 60) {
                heatClass = 'temp-warm';
            }
            item.className = `temp-item ${heatClass}`;
            const title = document.createElement('strong');
            title.textContent = temp.name || 'Sensor';
            const value = document.createElement('span');
            value.textContent = value !== null ? `${value.toFixed(1)} °C` : '--';
            item.appendChild(title);
            item.appendChild(value);
            els.tempList.appendChild(item);
        });
    } else {
        els.tempList.innerHTML = '<div class="muted">Нет данных по температурам</div>';
    }

    drawSparkline(els.cpuChart, metricsHistory.cpu, 'rgba(73, 194, 255, 1)');
    drawSparkline(els.memChart, metricsHistory.mem, 'rgba(246, 183, 60, 1)');
}

async function fetchMetrics() {
    try {
        const response = await fetch('/api/metrics', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Metrics error');
        }
        const data = await response.json();
        updateMetrics(data);
    } catch (error) {
        setMetricsOffline();
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
    document.body.classList.remove('no-js');

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
fetchMetrics();
window.setInterval(fetchStatus, 4000);
window.setInterval(fetchMetrics, 5000);
