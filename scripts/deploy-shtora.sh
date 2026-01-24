#!/usr/bin/env bash
set -euo pipefail

cd /srv/shtora
git pull --ff-only
docker compose up -d
