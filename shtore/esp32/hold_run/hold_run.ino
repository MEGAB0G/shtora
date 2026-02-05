// Standalone test firmware (no Wi-Fi)

// ====== Pins (update to your wiring) ======
#define M1_IN1 25
#define M1_IN2 26
#define M1_IN3 27
#define M1_IN4 14

#define LIMIT_LEFT 32
#define LIMIT_ACTIVE_LOW 0 // 0 = NC (HIGH = pressed), 1 = NC to GND (LOW = pressed)

// L298N enable (set to -1 if tied to 5V)
#define M1_ENA -1

// Using LIMIT_LEFT as hold-to-run button

// ====== Motion config ======
const int STEP_DELAY_US = 1200;

// ====== Stepper half-step ======
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
long stepsLeft = 0;
unsigned long lastStepUs = 0;
unsigned long lastLogMs = 0;
unsigned long startMs = 0;

void setM1(bool a1, bool a2, bool b1, bool b2) {
  digitalWrite(M1_IN1, a1);
  digitalWrite(M1_IN2, a2);
  digitalWrite(M1_IN3, b1);
  digitalWrite(M1_IN4, b2);
}

void releaseMotors() {
  setM1(0,0,0,0);
}

void stepMotor1(int dir) {
  stepIndex1 = (stepIndex1 + (dir > 0 ? 1 : 7)) & 0x07;
  const uint8_t* s = HALF_SEQ[stepIndex1];
  setM1(s[0], s[1], s[2], s[3]);
}

bool hitLeft() {
#if LIMIT_ACTIVE_LOW
  return digitalRead(LIMIT_LEFT) == LOW;
#else
  return digitalRead(LIMIT_LEFT) == HIGH;
#endif
}

void setup() {
  Serial.begin(115200);
  startMs = millis();

  pinMode(M1_IN1, OUTPUT);
  pinMode(M1_IN2, OUTPUT);
  pinMode(M1_IN3, OUTPUT);
  pinMode(M1_IN4, OUTPUT);

  if (M1_ENA >= 0) {
    pinMode(M1_ENA, OUTPUT);
    digitalWrite(M1_ENA, HIGH);
  }

  pinMode(LIMIT_LEFT, INPUT_PULLUP);

  releaseMotors();
}

void loop() {
  bool leftPressed = hitLeft();
  bool limitPressed = false;
  unsigned long nowUs = micros();
  if (nowUs - lastStepUs >= (unsigned long)STEP_DELAY_US) {
    lastStepUs = nowUs;

    if (leftPressed && !limitPressed) {
      stepMotor1(-1);
      stepsLeft++;
    }

    if (!leftPressed || limitPressed) {
      releaseMotors();
    }
  }

  unsigned long nowMs = millis();
  if (nowMs - lastLogMs >= 1000) {
    lastLogMs = nowMs;
    unsigned long sec = (nowMs - startMs) / 1000;
    float angleLeft = stepsLeft * 0.9f;  // TODO: set real degrees/step
    Serial.print("t=" + String(sec) + "s ");
    Serial.print("btn=" + String(leftPressed ? "down" : "up") + " ");
    Serial.print("limit=" + String(limitPressed ? "pressed" : "free") + " ");
    Serial.print("steps=" + String(stepsLeft) + " ");
    Serial.print("angle=" + String(angleLeft, 1));
    Serial.println();
  }
}
