# shtora

Локальный сервер для управления шторой + NAS. Проект живет на ноутбуке, сервер берет обновления с GitHub только вручную.

## Схема деплоя

Ноутбук:
```bash
cd C:\Users\1\Desktop\shtora
git add .
git commit -m "update"
git push
```

Сервер:
```bash
cd /srv/shtora
git pull
sudo docker compose down
sudo docker compose up -d --force-recreate
```

## Диски и точки монтирования

- SSD 120 ГБ (`/dev/sdd`) — система, Docker, код.
- RAID1 из двух Seagate 500 ГБ (`/dev/sda` + `/dev/sdb`) → `/srv`.
- WD 500 ГБ (`/dev/sdc`) → `/exchange`.

Проверка:
```bash
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT
cat /proc/mdstat
sudo mdadm --detail /dev/md0
df -h / /srv /exchange
```

## NAS (SMB)

Скрипт для восстановления структуры и прав (безопасно повторять):
```bash
cd /srv/shtora
sudo ./scripts/nas-setup.sh
```

Проверка:
```bash
sudo ./scripts/nas-verify.sh
```

Шары:
```
\\192.168.0.45\raid
\\192.168.0.45\trash
```

Админ-шары:
```
\\192.168.0.45\raid_admin
\\192.168.0.45\trash_admin
```

Если в Windows ошибки доступа — очистить сессии:
```cmd
net use \\192.168.0.45 /delete
```

## Квоты

150 ГБ на RAID и 150 ГБ на TRASH каждому пользователю:
```bash
sudo ./scripts/quota-setup.sh
```

Проверка:
```bash
sudo quota -u oleg
sudo quota -u rom
sudo quota -u TTSMANAGERR
sudo repquota -a
```

## Сайт (панель NAS)

UI показывает использование RAID/TRASH по пользователям.
Источник: `index.html`, `app.js`, `shtora.css`.
API: `phone-server/server.js` (`/api/user-usage`).

Проверка:
```bash
curl -s http://localhost/ | head -n 5
curl -s http://localhost/api/user-usage
```

## Автозапуск NAS при ребуте

Сервис:
```bash
sudo systemctl status shtora-nas-setup.service --no-pager
```

## Проверка после ребута

```bash
systemctl is-system-running
systemctl --failed
findmnt /srv /exchange
sudo systemctl status shtora-nas-setup.service --no-pager
docker ps
```
