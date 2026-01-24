# Shtora NAS

Local control panel and NAS for a headless Debian 12 home server. The server is updated only by manual deploy, with a clean and predictable flow.

## Overview

- OS: Debian 12 (headless).
- Purpose: curtain control panel + NAS.
- LAN only, no automatic updates, full manual control.
- Server pulls from GitHub when you run the deploy command.

## Repository layout

- `index.html` - NAS dashboard UI.
- `app.js` - frontend logic for usage cards.
- `shtora.css` - UI styling.
- `phone-server/server.js` - API server (`/api/user-usage` and status endpoints).
- `docker-compose.yml` - web + API containers.
- `nginx.conf` - web proxy for `/api/`.
- `scripts/` - NAS setup, verify, deploy, quotas.

## Deployment flow

Laptop (Windows, VS Code):
```bash
cd C:\Users\1\Desktop\shtora
git add .
git commit -m "update"
git push
```

Server (Debian):
```bash
cd /srv/shtora
git pull
sudo docker compose down
sudo docker compose up -d --force-recreate
```

## Storage configuration

Physical disks:
- SSD 120 GB: `/dev/sdd` (system, Docker, project code).
- Seagate 500 GB + Seagate 500 GB: `/dev/sda` + `/dev/sdb` (RAID1).
- WD 500 GB: `/dev/sdc` (scratch / exchange).

Mount points:
- RAID1: `/srv`
- Single disk: `/exchange`

Check status:
```bash
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT
cat /proc/mdstat
sudo mdadm --detail /dev/md0
df -h / /srv /exchange
```

## NAS (SMB) shares

Shared paths:
```
\\192.168.0.45\raid
\\192.168.0.45\trash
```

Admin shares:
```
\\192.168.0.45\raid_admin
\\192.168.0.45\trash_admin
```

If Windows blocks access because of cached credentials:
```cmd
net use \\192.168.0.45 /delete
```

## NAS setup and repair

Run once or anytime to restore folder structure and permissions:
```bash
cd /srv/shtora
sudo ./scripts/nas-setup.sh
```

Verify:
```bash
sudo ./scripts/nas-verify.sh
```

## Quotas

Each user has 150 GB on RAID and 150 GB on TRASH:
```bash
sudo ./scripts/quota-setup.sh
```

Verify:
```bash
sudo quota -u oleg
sudo quota -u rom
sudo quota -u TTSMANAGERR
sudo repquota -a
```

## Web UI (NAS dashboard)

The UI displays per-user RAID/TRASH usage and free space.

Quick checks:
```bash
curl -s http://localhost/ | head -n 5
curl -s http://localhost/api/user-usage
```

## Autostart on reboot

NAS restore service:
```bash
sudo systemctl status shtora-nas-setup.service --no-pager
```

Optional daily verify:
```bash
sudo systemctl status shtora-nas-verify.timer --no-pager
```

## Post-reboot checklist

```bash
systemctl is-system-running
systemctl --failed
findmnt /srv /exchange
sudo systemctl status shtora-nas-setup.service --no-pager
docker ps
```

## Notes

- Do not edit code on the server.
- Always update via the laptop -> GitHub -> manual pull flow.
- Keep the server clean: no auto-update, no background deploy.
