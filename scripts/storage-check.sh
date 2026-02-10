#!/usr/bin/env bash
set -euo pipefail

echo "== Repo location =="
pwd
df -h .

echo
echo "== Mounts =="
df -h /home /srv /exchange

echo
echo "== Code markers on HDD/RAID (should be empty) =="
find /srv /exchange -maxdepth 4 \
  -name .git -o -name docker-compose.yml -o -name "*.sh" -o -name "package.json" -o -name "app.js" -o -name "nginx.conf" 2>/dev/null || true
