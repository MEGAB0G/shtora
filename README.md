# shtora

## Запуск через Docker (рекомендуется)

### Установка Docker на Debian 12

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

### Запуск проекта

```bash
cd /srv/shtora
docker compose up -d
```

Сайт будет доступен по адресу `http://<IP-сервера>/`.

После `deploy-shtora` достаточно выполнить `docker compose up -d`, чтобы применить новые файлы.

## Локальный запуск на ноутбуке

```bash
node phone-server/server.js
```

Открой `http://localhost:8080`.
