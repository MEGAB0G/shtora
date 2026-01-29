#!/usr/bin/env bash
set -euo pipefail

# Restrict SFTP users to only RAID/TRASH folders.
# Users: oleg, rom, TTSMANAGERR

GROUP="sftpusers"
USERS=("oleg" "rom" "TTSMANAGERR")

sudo groupadd -f "${GROUP}"

for user in "${USERS[@]}"; do
  sudo usermod -aG "${GROUP}" "${user}"
done

for user in "${USERS[@]}"; do
  sudo mkdir -p "/sftp/${user}/raid" "/sftp/${user}/trash"
  sudo chown root:root "/sftp/${user}" "/sftp/${user}/raid" "/sftp/${user}/trash"
  sudo chmod 755 "/sftp/${user}" "/sftp/${user}/raid" "/sftp/${user}/trash"

  if ! mountpoint -q "/sftp/${user}/raid"; then
    sudo mount --bind "/srv/safe/${user}" "/sftp/${user}/raid"
  fi
  if ! mountpoint -q "/sftp/${user}/trash"; then
    sudo mount --bind "/exchange/trash/${user}" "/sftp/${user}/trash"
  fi

  if ! grep -q "^/srv/safe/${user} /sftp/${user}/raid " /etc/fstab; then
    echo "/srv/safe/${user} /sftp/${user}/raid none bind 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi
  if ! grep -q "^/exchange/trash/${user} /sftp/${user}/trash " /etc/fstab; then
    echo "/exchange/trash/${user} /sftp/${user}/trash none bind 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi
done

if ! grep -q "^Match Group ${GROUP}$" /etc/ssh/sshd_config; then
  sudo tee -a /etc/ssh/sshd_config >/dev/null <<EOF

Match Group ${GROUP}
    ChrootDirectory /sftp/%u
    ForceCommand internal-sftp
    X11Forwarding no
    AllowTCPForwarding no
EOF
fi

sudo systemctl restart sshd
echo "SFTP restriction applied for users: ${USERS[*]}"
