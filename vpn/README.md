# Hiddify install (Debian)

This folder expects the Hiddify `.deb` to be copied to the server.

Steps on the server:

```bash
cd ~/vpn
ls -la
sudo apt update
sudo apt install -y dpkg
sudo apt install -y ./Hiddify-Debian-x64.deb
```

If dependencies are missing:

```bash
sudo apt -f install
```

If the file name differs, replace `Hiddify-Debian-x64.deb` with the actual name.
