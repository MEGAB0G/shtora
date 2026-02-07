#!/usr/bin/env bash
set -euo pipefail

cd /home/mega/shtora
git pull --ff-only
docker compose up -d
