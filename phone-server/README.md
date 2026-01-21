# Phone server (Termux)

This server runs on your phone and serves the web UI, stores state, and sends commands to ESP32.

## 1) Install Termux (Android)
Install Termux from F-Droid (recommended) or Google Play.

## 2) Setup Node.js
```bash
pkg update -y
pkg install -y nodejs
```

## 3) Copy project to phone
Copy the whole project folder to your phone, for example:
`/storage/emulated/0/shtora`

Then in Termux:
```bash
cd /storage/emulated/0/shtora/phone-server
npm install
```

## 4) Start server
```bash
npm start
```
Open in browser:
```
http://<PHONE_IP>:8080/
```
Find phone IP on the same Wi-Fi (Android Wi-Fi details).

## 5) ESP32 polling (commands)
ESP32 should read commands:
- GET `http://<PHONE_IP>:8080/api/command`
- When command received, execute and ACK:
  - POST `http://<PHONE_IP>:8080/api/command/ack`
  - Body: `{ "id": <command_id> }`

ESP32 can also send status to the phone:
- POST `http://<PHONE_IP>:8080/api/status`
  - Body example:
    ```json
    {
      "position": 42,
      "target": 60,
      "moving": "moving",
      "wifi": { "ssid": "HomeWiFi", "rssi": -52 },
      "ip": "192.168.1.55",
      "cloud": { "connected": true, "latency": 120, "server": "phone" },
      "motor": { "mode": "run", "current": 310, "temp": 38 }
    }
    ```

## Optional: public access without white IP
Use Cloudflare Tunnel on phone (still no VPS):
1) Install cloudflared in Termux:
```bash
pkg install -y cloudflared
```
2) Start tunnel:
```bash
cloudflared tunnel --url http://localhost:8080
```
Cloudflare will give you a public URL to open from anywhere.
