const els = {
    usageUpdated: document.getElementById('usageUpdated'),
    userCards: document.getElementById('userCards')
};

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

function formatLimit(value) {
    if (!Number.isFinite(value)) {
        return '--';
    }
    const gb = value / (1024 ** 3);
    return `${gb.toFixed(0)} GB`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function renderUsers(data) {
    if (!data || !Array.isArray(data.users)) {
        els.userCards.innerHTML = '<div class="status-card"><div class="panel-title">Нет данных</div></div>';
        return;
    }

    const updated = data.ts ? new Date(data.ts) : new Date();
    els.usageUpdated.textContent = updated.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    els.userCards.innerHTML = '';
    data.users.forEach((user) => {
        const card = document.createElement('div');
        card.className = 'usage-card';

        const header = document.createElement('div');
        header.className = 'usage-header';
        const title = document.createElement('div');
        title.className = 'usage-title';
        title.textContent = user.name;
        const totalUsed = (user.raidUsed || 0) + (user.trashUsed || 0);
        const totalLimit = (user.limitBytes || 0) * 2;
        const remaining = Math.max(totalLimit - totalUsed, 0);
        const summary = document.createElement('div');
        summary.className = 'usage-summary';
        summary.textContent = `Свободно: ${formatBytes(remaining)} / ${formatLimit(totalLimit)}`;
        header.appendChild(title);
        header.appendChild(summary);
        card.appendChild(header);

        const sections = [
            { label: 'RAID', used: user.raidUsed, limit: user.limitBytes },
            { label: 'TRASH', used: user.trashUsed, limit: user.limitBytes }
        ];

        sections.forEach((section) => {
            const row = document.createElement('div');
            row.className = 'usage-row';
            const label = document.createElement('span');
            label.textContent = section.label;
            const values = document.createElement('strong');
            values.textContent = `${formatBytes(section.used)} / ${formatLimit(section.limit)}`;
            row.appendChild(label);
            row.appendChild(values);

            const percent = section.limit ? clamp((section.used / section.limit) * 100, 0, 100) : 0;
            const bar = document.createElement('div');
            bar.className = 'bar';
            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.width = `${percent}%`;
            bar.appendChild(fill);

            card.appendChild(row);
            card.appendChild(bar);
        });

        els.userCards.appendChild(card);
    });
}

async function fetchUsage() {
    try {
        const response = await fetch('/api/user-usage', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Usage error');
        }
        const data = await response.json();
        renderUsers(data);
    } catch (error) {
        renderUsers(null);
    }
}

fetchUsage();
window.setInterval(fetchUsage, 5000);
