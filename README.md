# Shtora NAS

Локальная панель и NAS для домашнего сервера на Debian 12.  
Все обновления только вручную, без авто-магии.

## Коротко про проект

- Система: Debian 12 (headless).
- Назначение: панель управления шторой + NAS.
- Сервер ничего не тянет сам, только ручной `git pull`.
- Редактируем код только на ноутбуке.

## Структура репозитория

- `index.html` - UI панели NAS.
- `app.js` - логика карточек по пользователям.
- `shtora.css` - стили.
- `phone-server/server.js` - API (`/api/user-usage` и статусные методы).
- `docker-compose.yml` - контейнеры web + api.
- `nginx.conf` - прокси `/api/`.
- `scripts/` - настройка NAS, проверка, квоты, деплой.

## Деплой (как делаем всегда)

Ноут:
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

## Диски и монтирование

Физика:
- SSD 120 ГБ (`/dev/sdd`) - система, Docker, код.
- Seagate 500 ГБ + Seagate 500 ГБ (`/dev/sda` + `/dev/sdb`) - RAID1.
- WD 500 ГБ (`/dev/sdc`) - обменник/помойка.

Монтирования:
- RAID1: `/srv`
- WD: `/exchange`

Проверки:
```bash
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT
cat /proc/mdstat
sudo mdadm --detail /dev/md0
df -h / /srv /exchange
```

## NAS (SMB)

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

Если Windows ругается на доступ:
```cmd
net use \\192.168.0.45 /delete
```

## NAS настройка/восстановление

Скрипт можно гонять сколько угодно - он возвращает папки и права:
```bash
cd /srv/shtora
sudo ./scripts/nas-setup.sh
```

Проверка:
```bash
sudo ./scripts/nas-verify.sh
```

## Квоты

Каждому пользователю: 150 ГБ RAID + 150 ГБ TRASH.
```bash
sudo ./scripts/quota-setup.sh
```

Проверка квот:
```bash
sudo quota -u oleg
sudo quota -u rom
sudo quota -u TTSMANAGERR
sudo repquota -a
```

## Сайт (панель NAS)

UI показывает использование RAID/TRASH по пользователям.

Проверки:
```bash
curl -s http://localhost/ | head -n 5
curl -s http://localhost/api/user-usage
```

## Автозапуск после ребута

NAS сервис:
```bash
sudo systemctl status shtora-nas-setup.service --no-pager
```

Опционально ежедневная проверка:
```bash
sudo systemctl status shtora-nas-verify.timer --no-pager
```

## Быстрый чек после перезагрузки

```bash
systemctl is-system-running
systemctl --failed
findmnt /srv /exchange
sudo systemctl status shtora-nas-setup.service --no-pager
docker ps
```

## Важно

- На сервере код не редактируем.
- Только ноут -> GitHub -> ручной pull.
- Никаких авто-обновлений и скрытых деплоев.
