#!/usr/bin/env bash
set -euo pipefail

echo "== Users =="
getent passwd mega oleg rom TTSMANAGERR || true

echo
echo "== Mounts =="
findmnt /srv || true
findmnt /exchange || true

echo
echo "== Shares =="
testparm -s || true

echo
echo "== ACL =="
getfacl /srv/safe/oleg /srv/safe/rom /srv/safe/TTSMANAGERR 2>/dev/null || true
getfacl /exchange/trash/oleg /exchange/trash/rom /exchange/trash/TTSMANAGERR 2>/dev/null || true

echo
echo "== Samba login test =="
smbclient -L localhost -U mega || true
