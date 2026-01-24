# shtora

## Конфигурация дисков и хранилища сервера

Сервер: Debian 12 (headless). Используется как NAS и хостинг сайта/сервисов.

### Физические диски

- SSD 120 ГБ (sdb) — системный диск.
- Seagate 500 ГБ (sda).
- Seagate 500 ГБ (sdd).
- WD 500 ГБ (sdc).

### Назначение и монтирование

- SSD (sdb):
  - Debian 12, Docker, код сайтов и сервисов.
  - Точка монтирования: `/`.
- Seagate 500 ГБ + Seagate 500 ГБ (sda + sdd):
  - RAID1 через `mdadm`, хранение важных данных.
  - При выходе одного диска данные сохраняются.
  - Планируемая точка монтирования: `/srv`.
- WD 500 ГБ (sdc):
  - Одиночный диск для некритичных данных.
  - Файлопомойка/обменник/временные файлы.
  - Точка монтирования: `/exchange`.

## NAS настройка (скрипт)

Готовый скрипт настройки RAID1 + SMB лежит в `scripts/nas-setup.sh`.
Перед запуском проверь устройства дисков и пароли в начале скрипта.

После запуска скрипта можно проверить состояние:

```bash
chmod +x /srv/shtora/scripts/nas-verify.sh
/srv/shtora/scripts/nas-verify.sh
```

Готовые блоки Samba добавлены в `config/smb.conf.additions` (если нужно сверить).

## Квоты пользователей (150 ГБ каждому)

Скрипт включает `usrquota` на `/srv` и `/exchange` и ставит лимит 150ГБ для
`oleg`, `rom`, `TTSMANAGERR` (админ `mega` без ограничений).

```bash
chmod +x /srv/shtora/scripts/quota-setup.sh
sudo /srv/shtora/scripts/quota-setup.sh
```

### Подключение клиентов

Windows (Проводник):

```
\\192.168.0.45\safe_oleg
\\192.168.0.45\safe_rom
\\192.168.0.45\safe_TTSMANAGERR
\\192.168.0.45\trash_oleg
\\192.168.0.45\trash_rom
\\192.168.0.45\trash_TTSMANAGERR
```

Android:
- Любой SMB клиент (CX File Explorer, Solid Explorer).
- Host: `192.168.0.45`, Username/Password.

## Автообновление с GitHub (без белого IP)

Из-за отсутствия публичного IP вебхуки GitHub не подойдут. Самый надежный вариант —
локальный polling через `systemd`-таймер, который раз в N минут делает `git pull`
и перезапускает контейнеры.

1) Сделай скрипт исполняемым:

```bash
chmod +x /srv/shtora/scripts/deploy-shtora.sh
```

2) Создай сервис `/etc/systemd/system/shtora-pull.service`:

```ini
[Unit]
Description=Shtora auto update

[Service]
Type=oneshot
ExecStart=/srv/shtora/scripts/deploy-shtora.sh
```

3) Таймер `/etc/systemd/system/shtora-pull.timer`:

```ini
[Unit]
Description=Run shtora auto update every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

4) Включить:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now shtora-pull.timer
```

## Запуск через Docker (рекомендуется)

### Установка Docker на Debian 12

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

### Запуск проекта

```bash
cd /srv/shtora
docker compose up -d
```

Сайт будет доступен по адресу `http://<IP-сервера>/`.

После `deploy-shtora` достаточно выполнить `docker compose up -d`, чтобы применить новые файлы.
При первом запуске контейнер API устанавливает зависимости.

## Локальный запуск на ноутбуке

```bash
node phone-server/server.js
```

Открой `http://localhost:8080`.
