#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEB_NAME="Hiddify-Debian-x64.deb"
DEB_PATH="${SCRIPT_DIR}/${DEB_NAME}"

if [[ ! -f "${DEB_PATH}" ]]; then
  echo "ERROR: ${DEB_NAME} not found in ${SCRIPT_DIR}" >&2
  echo "Put the .deb here or update the script with the correct filename." >&2
  exit 1
fi

sudo apt update
sudo apt install -y dpkg
sudo apt install -y "${DEB_PATH}"
