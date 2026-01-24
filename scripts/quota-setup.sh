#!/usr/bin/env bash
set -euo pipefail

# Enable and configure user quotas on /srv and /exchange.
# This script edits /etc/fstab and applies 150G limits to NAS users.

USERS=("oleg" "rom" "TTSMANAGERR")
LIMIT_KB=157286400

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

uuid_srv="$(blkid -s UUID -o value /dev/md0 || true)"
uuid_ex="$(blkid -s UUID -o value /dev/sdc || true)"

if [[ -z "${uuid_srv}" || -z "${uuid_ex}" ]]; then
  echo "UUID not found. Check /dev/md0 and /dev/sdc."
  exit 1
fi

cp /etc/fstab "/etc/fstab.bak.$(date +%Y%m%d%H%M%S)"

apply_quota() {
  local mount="$1"
  local uuid="$2"
  if grep -q "UUID=${uuid}" /etc/fstab; then
    sed -i "s|UUID=${uuid}[[:space:]]\\+${mount}[[:space:]]\\+ext4[[:space:]]\\+|UUID=${uuid}  ${mount}  ext4  |" /etc/fstab
    if ! grep -q "UUID=${uuid}.*${mount}.*usrquota" /etc/fstab; then
      sed -i "s|UUID=${uuid}[[:space:]]\\+${mount}[[:space:]]\\+ext4[[:space:]]\\+\\([^[:space:]]\\+\\)|UUID=${uuid}  ${mount}  ext4  \\1,usrquota|" /etc/fstab
    fi
  else
    echo "UUID=${uuid}  ${mount}  ext4  defaults,nofail,usrquota  0 2" >> /etc/fstab
  fi
}

apply_quota "/srv" "${uuid_srv}"
apply_quota "/exchange" "${uuid_ex}"

systemctl daemon-reload
mount -o remount /srv
mount -o remount /exchange

apt update
apt install -y quota

quotacheck -cum /srv
quotacheck -cum /exchange
quotaon /srv
quotaon /exchange

for user in "${USERS[@]}"; do
  setquota -u "${user}" "${LIMIT_KB}" "${LIMIT_KB}" 0 0 /srv
  setquota -u "${user}" "${LIMIT_KB}" "${LIMIT_KB}" 0 0 /exchange
done

echo "Quota applied: 150G per user on /srv and /exchange."
