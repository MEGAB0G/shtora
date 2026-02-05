#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>

// ================== Wi-Fi / Server ==================
// TODO: put your Wi-Fi here
const char* WIFI_SSID = "111";
const char* WIFI_PASS = "88888888";

// Server base URL (no trailing slash), example: http://192.168.0.45
const char* SERVER_URL = "https://romankovich.ru";

// ================== Pins (update to your wiring) ==================
#define RELAY_PIN 23
#define RELAY_ACTIVE_LOW 0

// Motor driver pins (2x L298N)
#define M1_IN1 25
#define M1_IN2 26
#define M1_IN3 27
#define M1_IN4 14

#define M2_IN1 18
#define M2_IN2 19
#define M2_IN3 21
#define M2_IN4 22

// Limit switches (INPUT_PULLUP)
#define LIMIT_LEFT 32
#define LIMIT_RIGHT 33
#define LIMIT_ACTIVE_LOW 0

// ================== Motion config ==================
const int STEP_DELAY_US = 1200;
const unsigned long POLL_INTERVAL_MS = 1000;
const unsigned long LIMIT_DEBOUNCE_MS = 30;

// ================== Network ==================
WiFiClient client;
WiFiClientSecure clientSecure;

String pollUrl;

// ================== Calibration storage ==================
Preferences prefs;
long fullSteps = 0;
bool calibrated = false;

// ================== Motion state ==================
long currentSteps = 0;
long targetSteps = 0;
bool hasTarget = false;
bool moving = false;
bool leftJogActive = false;
bool rightJogActive = false;
unsigned long leftJogEndMs = 0;
unsigned long rightJogEndMs = 0;
long leftStepsRemaining = 0;
long rightStepsRemaining = 0;

enum MotionMode {
  MODE_IDLE,
  MODE_OPENING,
  MODE_CLOSING,
  MODE_CALIB_LEFT,
  MODE_CALIB_RIGHT
};

MotionMode motionMode = MODE_IDLE;

// ================== Timers ==================
unsigned long lastPoll = 0;
unsigned long lastStepUs = 0;
unsigned long lastReconnectAttempt = 0;

// ================== Relay helpers ==================
void relayOff() {
  pinMode(RELAY_PIN, INPUT_PULLUP);
}

void relayOnFunc() {
  pinMode(RELAY_PIN, OUTPUT);
#if RELAY_ACTIVE_LOW
  digitalWrite(RELAY_PIN, LOW);
#else
  digitalWrite(RELAY_PIN, HIGH);
#endif
}

void setRelay(bool on) {
  if (on) relayOnFunc();
  else relayOff();
}

void initRelaySafeOff() {
  relayOff();
  delay(10);
}

// ================== Motor helpers ==================
const uint8_t HALF_SEQ[8][4] = {
  {1,0,0,0},
  {1,0,1,0},
  {0,0,1,0},
  {0,1,1,0},
  {0,1,0,0},
  {0,1,0,1},
  {0,0,0,1},
  {1,0,0,1}
};

uint8_t stepIndex1 = 0;
uint8_t stepIndex2 = 0;

void setM1(bool a1, bool a2, bool b1, bool b2) {
  digitalWrite(M1_IN1, a1);
  digitalWrite(M1_IN2, a2);
  digitalWrite(M1_IN3, b1);
  digitalWrite(M1_IN4, b2);
}

void setM2(bool a1, bool a2, bool b1, bool b2) {
  digitalWrite(M2_IN1, a1);
  digitalWrite(M2_IN2, a2);
  digitalWrite(M2_IN3, b1);
  digitalWrite(M2_IN4, b2);
}

void releaseMotors() {
  setM1(0,0,0,0);
  setM2(0,0,0,0);
}

void stepMotor1(int dir) {
  stepIndex1 = (stepIndex1 + (dir > 0 ? 1 : 7)) & 0x07;
  const uint8_t* s = HALF_SEQ[stepIndex1];
  setM1(s[0], s[1], s[2], s[3]);
}

void stepMotor2(int dir) {
  stepIndex2 = (stepIndex2 + (dir > 0 ? 1 : 7)) & 0x07;
  const uint8_t* s = HALF_SEQ[stepIndex2];
  setM2(s[0], s[1], s[2], s[3]);
}

void stepOpen() {
  stepMotor1(1);
  stepMotor2(-1);
}

void stepClose() {
  stepMotor1(-1);
  stepMotor2(1);
}

// ================== Limits ==================
bool hitLeft() {
#if LIMIT_ACTIVE_LOW
  return digitalRead(LIMIT_LEFT) == LOW;
#else
  return digitalRead(LIMIT_LEFT) == HIGH;
#endif
}

bool hitRight() {
#if LIMIT_ACTIVE_LOW
  return digitalRead(LIMIT_RIGHT) == LOW;
#else
  return digitalRead(LIMIT_RIGHT) == HIGH;
#endif
}

bool limitTriggered(bool left) {
  static bool lastLeft = false;
  static bool lastRight = false;
  static unsigned long lastChangeMs = 0;

  bool current = left ? hitLeft() : hitRight();
  bool* last = left ? &lastLeft : &lastRight;

  if (current != *last) {
    lastChangeMs = millis();
    *last = current;
  }
  if (!current) return false;
  return (millis() - lastChangeMs) >= LIMIT_DEBOUNCE_MS;
}

// ================== Calibration storage ==================
void loadCalibration() {
  prefs.begin("shtora", true);
  fullSteps = prefs.getLong("full", 0);
  prefs.end();
  calibrated = fullSteps > 0;
}

void saveCalibration() {
  prefs.begin("shtora", false);
  prefs.putLong("full", fullSteps);
  prefs.end();
}

// ================== URL helpers ==================
String normalizeUrl(const String& url) {
  String u = url;
  u.trim();
  while (u.endsWith("/")) {
    u.remove(u.length() - 1);
  }
  return u;
}

bool beginHttp(HTTPClient& http, const String& url) {
  if (url.startsWith("https://")) {
    clientSecure.setInsecure();
    return http.begin(clientSecure, url);
  }
  return http.begin(client, url);
}

// ================== JSON helpers ==================
bool parseJsonLong(const String& body, const char* key, long& out) {
  String needle = String("\"") + key + "\":";
  int i = body.indexOf(needle);
  if (i < 0) return false;
  i += needle.length();
  while (i < (int)body.length() && body[i] == ' ') i++;
  if (body.startsWith("null", i)) return false;
  int e = i;
  while (e < (int)body.length() && (isDigit(body[e]) || body[e] == '-')) e++;
  out = body.substring(i, e).toInt();
  return true;
}

String parseJsonString(const String& body, const char* key) {
  String needle = String("\"") + key + "\":\"";
  int i = body.indexOf(needle);
  if (i < 0) return "";
  i += needle.length();
  int e = body.indexOf('"', i);
  if (e < 0) return "";
  return body.substring(i, e);
}

String jsonEscape(const String& input) {
  String out;
  out.reserve(input.length() + 8);
  for (size_t i = 0; i < input.length(); i++) {
    char c = input[i];
    if (c == '"' || c == '\\') out += '\\';
    out += c;
  }
  return out;
}

// ================== Status ==================
String motionLabel() {
  switch (motionMode) {
    case MODE_OPENING: return "moving";
    case MODE_CLOSING: return "moving";
    case MODE_CALIB_LEFT: return "calibrating";
    case MODE_CALIB_RIGHT: return "calibrating";
    default: return "idle";
  }
}

int positionPercent() {
  if (!calibrated || fullSteps <= 0) return -1;
  long clamped = currentSteps;
  if (clamped < 0) clamped = 0;
  if (clamped > fullSteps) clamped = fullSteps;
  return (int)((clamped * 100L) / fullSteps);
}

int targetPercent() {
  if (!calibrated || fullSteps <= 0 || !hasTarget) return -1;
  long clamped = targetSteps;
  if (clamped < 0) clamped = 0;
  if (clamped > fullSteps) clamped = fullSteps;
  return (int)((clamped * 100L) / fullSteps);
}

// ================== Motion control ==================
void stopMotion() {
  moving = false;
  motionMode = MODE_IDLE;
  hasTarget = false;
  leftJogActive = false;
  rightJogActive = false;
  leftJogEndMs = 0;
  rightJogEndMs = 0;
  leftStepsRemaining = 0;
  rightStepsRemaining = 0;
  setRelay(false);
  releaseMotors();
}

void startMotion(MotionMode mode) {
  motionMode = mode;
  moving = true;
  setRelay(true);
}

void commandOpen() {
  hasTarget = calibrated;
  if (calibrated) targetSteps = fullSteps;
  startMotion(MODE_OPENING);
}

void commandClose() {
  hasTarget = calibrated;
  if (calibrated) targetSteps = 0;
  startMotion(MODE_CLOSING);
}

void commandGoto(int pct) {
  if (!calibrated || fullSteps <= 0) return;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  targetSteps = (fullSteps * pct) / 100L;
  hasTarget = true;
  if (targetSteps > currentSteps) startMotion(MODE_OPENING);
  else if (targetSteps < currentSteps) startMotion(MODE_CLOSING);
  else stopMotion();
}

void commandCalibrateStart() {
  calibrated = false;
  fullSteps = 0;
  saveCalibration();
  hasTarget = false;
  startMotion(MODE_CALIB_LEFT);
}

void commandCalibrateStop() {
  stopMotion();
}

void commandLeftDown10() {
  if (moving) stopMotion();
  leftJogActive = true;
  leftJogEndMs = millis() + 10000;
  leftStepsRemaining = 0;
  setRelay(true);
}

void commandRightDown10() {
  if (moving) stopMotion();
  rightJogActive = true;
  rightJogEndMs = millis() + 10000;
  rightStepsRemaining = 0;
  setRelay(true);
}

void commandLeftSteps(long steps) {
  if (moving) stopMotion();
  if (steps <= 0) return;
  leftJogActive = true;
  leftJogEndMs = 0;
  leftStepsRemaining = steps;
  setRelay(true);
}

void commandRightSteps(long steps) {
  if (moving) stopMotion();
  if (steps <= 0) return;
  rightJogActive = true;
  rightJogEndMs = 0;
  rightStepsRemaining = steps;
  setRelay(true);
}

void commandRelayOff() {
  stopMotion();
}

void handleLeftLimit() {
  currentSteps = 0;
  if (motionMode == MODE_CALIB_LEFT) {
    startMotion(MODE_CALIB_RIGHT);
  } else {
    stopMotion();
  }
}

void handleRightLimit() {
  if (motionMode == MODE_CALIB_RIGHT) {
    fullSteps = currentSteps;
    if (fullSteps < 1) fullSteps = 1;
    calibrated = true;
    saveCalibration();
  }
  if (calibrated) currentSteps = fullSteps;
  stopMotion();
}

void stepTick() {
  if (!moving && !leftJogActive && !rightJogActive) return;
  unsigned long nowUs = micros();
  if (nowUs - lastStepUs < (unsigned long)STEP_DELAY_US) return;
  lastStepUs = nowUs;

  if (!moving) {
    bool anyJog = false;
    unsigned long nowMs = millis();

    if (leftJogActive) {
      if ((leftJogEndMs > 0 && nowMs >= leftJogEndMs) || (leftJogEndMs == 0 && leftStepsRemaining == 0)) {
        leftJogActive = false;
      } else {
        if (limitTriggered(true)) {
          leftJogActive = false;
        } else {
          stepMotor1(-1);
          if (leftJogEndMs == 0 && leftStepsRemaining > 0) leftStepsRemaining--;
        }
      }
    }

    if (rightJogActive) {
      if ((rightJogEndMs > 0 && nowMs >= rightJogEndMs) || (rightJogEndMs == 0 && rightStepsRemaining == 0)) {
        rightJogActive = false;
      } else {
        if (limitTriggered(false)) {
          rightJogActive = false;
        } else {
          stepMotor2(1);
          if (rightJogEndMs == 0 && rightStepsRemaining > 0) rightStepsRemaining--;
        }
      }
    }

    anyJog = leftJogActive || rightJogActive;
    if (!anyJog) {
      setRelay(false);
      releaseMotors();
    }
    return;
  }

  int dir = (motionMode == MODE_OPENING || motionMode == MODE_CALIB_RIGHT) ? 1 : -1;

  if (dir < 0 && limitTriggered(true)) {
    handleLeftLimit();
    return;
  }
  if (dir > 0 && limitTriggered(false)) {
    handleRightLimit();
    return;
  }

  if (dir > 0) {
    stepOpen();
    currentSteps++;
  } else {
    stepClose();
    currentSteps--;
  }

  if ((motionMode == MODE_OPENING || motionMode == MODE_CLOSING) && hasTarget) {
    if (dir > 0 && currentSteps >= targetSteps) stopMotion();
    if (dir < 0 && currentSteps <= targetSteps) stopMotion();
  }
}

// ================== Server poll (single endpoint) ==================
void pollServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  int pos = positionPercent();
  int tgt = targetPercent();
  String payload = "{";
  payload += "\"position\":" + String(pos) + ",";
  payload += "\"target\":" + String(tgt) + ",";
  payload += "\"moving\":\"" + motionLabel() + "\",";
  payload += "\"wifi\":{\"ssid\":\"" + jsonEscape(WiFi.SSID()) + "\",\"rssi\":" + String(WiFi.RSSI()) + "},";
  payload += "\"ip\":\"" + WiFi.localIP().toString() + "\"";
  payload += "}";

  HTTPClient http;
  if (!beginHttp(http, pollUrl)) return;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  if (code != 200) {
    http.end();
    return;
  }

  String body = http.getString();
  http.end();

  long cmdId = 0;
  if (!parseJsonLong(body, "id", cmdId)) return;
  if (cmdId == 0) return;

  String action = parseJsonString(body, "action");
  long posCmd = 0;
  bool hasPos = parseJsonLong(body, "position", posCmd);

  if (action == "open") commandOpen();
  else if (action == "close") commandClose();
  else if (action == "stop") stopMotion();
  else if (action == "goto" && hasPos) commandGoto((int)posCmd);
  else if (action == "calibrate:start") commandCalibrateStart();
  else if (action == "calibrate:stop") commandCalibrateStop();
  else if (action == "left-down-10") commandLeftDown10();
  else if (action == "right-down-10") commandRightDown10();
  else if (action == "left-steps" && hasPos) commandLeftSteps(posCmd);
  else if (action == "right-steps" && hasPos) commandRightSteps(posCmd);
  else if (action == "relay-off") commandRelayOff();
}

// ================== Wi-Fi ==================
bool connectWiFi15s() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) {
    delay(500);
  }
  return WiFi.status() == WL_CONNECTED;
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  unsigned long now = millis();
  if (now - lastReconnectAttempt < 5000) return;
  lastReconnectAttempt = now;
  WiFi.disconnect(false);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

// ================== Setup / Loop ==================
void setup() {
  Serial.begin(115200);
  initRelaySafeOff();

  pinMode(M1_IN1, OUTPUT);
  pinMode(M1_IN2, OUTPUT);
  pinMode(M1_IN3, OUTPUT);
  pinMode(M1_IN4, OUTPUT);

  pinMode(M2_IN1, OUTPUT);
  pinMode(M2_IN2, OUTPUT);
  pinMode(M2_IN3, OUTPUT);
  pinMode(M2_IN4, OUTPUT);

  pinMode(LIMIT_LEFT, INPUT_PULLUP);
  pinMode(LIMIT_RIGHT, INPUT_PULLUP);

  loadCalibration();

  String base = normalizeUrl(String(SERVER_URL));
  pollUrl = base + "/api/poll";

  connectWiFi15s();
}

void loop() {
  ensureWiFi();

  unsigned long now = millis();
  if (!moving && !leftJogActive && !rightJogActive) {
    if (now - lastPoll >= POLL_INTERVAL_MS) {
      lastPoll = now;
      pollServer();
    }
  }

  stepTick();
}
