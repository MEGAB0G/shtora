#!/usr/bin/env bash
set -euo pipefail

# NAS setup for Debian 12.
# WARNING: this wipes /dev/sda, /dev/sdb, /dev/sdc.
# SSD system disk is /dev/sdd and is NOT touched.

RAID_DEV="/dev/md0"
RAID_DISKS=("/dev/sda" "/dev/sdb")
EXCHANGE_DISK="/dev/sdc"

ADMIN_USER="mega"
ADMIN_PASS="89122844175"

USERS=("oleg" "rom" "TTSMANAGERR")
PASSWORDS=("22844175" "20144" "15528")

sudo apt update
sudo apt install -y mdadm acl samba

if sudo mdadm --detail "${RAID_DEV}" >/dev/null 2>&1; then
  echo "RAID ${RAID_DEV} already exists, skip wipe/create."
else
  sudo wipefs -a "${RAID_DISKS[@]}" "${EXCHANGE_DISK}"
  sudo mdadm --create "${RAID_DEV}" --level=1 --raid-devices=2 "${RAID_DISKS[@]}"
fi

if [ "$(blkid -s TYPE -o value "${RAID_DEV}" 2>/dev/null || true)" != "ext4" ]; then
  sudo mkfs.ext4 "${RAID_DEV}"
else
  echo "${RAID_DEV} already has ext4, skip mkfs."
fi

if [ "$(blkid -s TYPE -o value "${EXCHANGE_DISK}" 2>/dev/null || true)" != "ext4" ]; then
  sudo mkfs.ext4 "${EXCHANGE_DISK}"
else
  echo "${EXCHANGE_DISK} already has ext4, skip mkfs."
fi

sudo mkdir -p /mnt/raid /mnt/exchange
mountpoint -q /mnt/raid || sudo mount "${RAID_DEV}" /mnt/raid
mountpoint -q /mnt/exchange || sudo mount "${EXCHANGE_DISK}" /mnt/exchange

sudo mkdir -p /mnt/raid/safe
sudo mkdir -p /mnt/exchange/trash

for i in "${!USERS[@]}"; do
  user="${USERS[$i]}"
  sudo adduser --disabled-password --gecos "" --allow-bad-names "${user}" || true
  sudo mkdir -p "/mnt/raid/safe/${user}" "/mnt/exchange/trash/${user}"
  sudo chown -R "${user}:${user}" "/mnt/raid/safe/${user}" "/mnt/exchange/trash/${user}"
  sudo chmod -R 0700 "/mnt/raid/safe/${user}" "/mnt/exchange/trash/${user}"
  sudo setfacl -m "u:${ADMIN_USER}:rwx" "/mnt/raid/safe/${user}" "/mnt/exchange/trash/${user}"
done

sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u

RAID_UUID="$(blkid -s UUID -o value "${RAID_DEV}")"
EXCHANGE_UUID="$(blkid -s UUID -o value "${EXCHANGE_DISK}")"

sudo mkdir -p /srv /exchange
sudo umount /mnt/raid /mnt/exchange

if ! grep -q "${RAID_UUID}" /etc/fstab; then
  echo "UUID=${RAID_UUID}  /srv       ext4  defaults,nofail  0 2" | sudo tee -a /etc/fstab
fi
if ! grep -q "${EXCHANGE_UUID}" /etc/fstab; then
  echo "UUID=${EXCHANGE_UUID}  /exchange  ext4  defaults,nofail  0 2" | sudo tee -a /etc/fstab
fi

sudo mount -a

sudo mkdir -p /srv/safe /exchange/trash
for user in "${USERS[@]}"; do
  sudo mv "/mnt/raid/safe/${user}" "/srv/safe/${user}" || true
  sudo mv "/mnt/exchange/trash/${user}" "/exchange/trash/${user}" || true
done

for user in "${USERS[@]}"; do
  sudo mkdir -p "/srv/safe/${user}" "/exchange/trash/${user}"
  sudo chown -R "${user}:${user}" "/srv/safe/${user}" "/exchange/trash/${user}"
  sudo chmod -R 0700 "/srv/safe/${user}" "/exchange/trash/${user}"
  sudo setfacl -m "u:${ADMIN_USER}:rwx" "/srv/safe/${user}" "/exchange/trash/${user}"
done

sudo awk 'BEGIN{drop=0} /^\[/{drop=0} /^\[(safe_|trash_)/{drop=1} !drop{print}' /etc/samba/smb.conf > /tmp/smb.conf
sudo mv /tmp/smb.conf /etc/samba/smb.conf

if ! grep -q "access based share enum" /etc/samba/smb.conf; then
  sudo sed -i "/^\[global\]/a\    access based share enum = yes\n    hide unreadable = yes" /etc/samba/smb.conf
fi

sudo tee -a /etc/samba/smb.conf >/dev/null <<'EOF'

[raid]
   path = /srv/safe/%U
   browseable = yes
   read only = no
   valid users = oleg rom TTSMANAGERR mega
   create mask = 0600
   directory mask = 0700

[trash]
   path = /exchange/trash/%U
   browseable = yes
   read only = no
   valid users = oleg rom TTSMANAGERR mega
   create mask = 0640
   directory mask = 0750

[raid_admin]
   path = /srv/safe
   browseable = no
   read only = no
   valid users = mega
   create mask = 0600
   directory mask = 0700

[trash_admin]
   path = /exchange/trash
   browseable = no
   read only = no
   valid users = mega
   create mask = 0640
   directory mask = 0750
EOF

echo "${ADMIN_USER}:${ADMIN_PASS}" | sudo chpasswd
sudo smbpasswd -a "${ADMIN_USER}" <<EOF
${ADMIN_PASS}
${ADMIN_PASS}
EOF

for i in "${!USERS[@]}"; do
  user="${USERS[$i]}"
  pass="${PASSWORDS[$i]}"
  echo "${user}:${pass}" | sudo chpasswd
  sudo smbpasswd -a "${user}" <<EOF
${pass}
${pass}
EOF
done

sudo systemctl restart smbd

echo "Done. Shares: \\\\192.168.0.45\\raid and \\\\192.168.0.45\\trash (admin: raid_admin, trash_admin)"
