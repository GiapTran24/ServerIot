/*
  Refactor ESP32 sensor -> Node API
  - WiFi reconnect
  - Server discovery with timeout/backoff (non-blocking)
  - JSON parsing with ArduinoJson
  - Safe HTTP handling
  - millis() timing (no blocking find in setup)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <Adafruit_BMP085.h>

// ========== Cấu hình WiFi ==========
const char* ssid = "Oh yeah";
const char* password = "Tien2002";

// ========== DHT22 ==========
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ========== BMP180 ==========
Adafruit_BMP085 bmp;

// ========== Device / Server ==========
const int DEVICE_ID = 1;
const char* DEVICE_NAME = "ESP32_LivingRoom";

const int serverPort = 5000;
String serverIP = "";               // discovered server IP (empty nếu chưa tìm)
const String serverApiPathSend = "/api/sensordata";
const String serverApiPathStatus = "/api/devices/"; // + <id> + "/status"

// ========== Timing & intervals ==========
const unsigned long SEND_INTERVAL_MS = 10000UL;      // gửi data mỗi 10s
const unsigned long FIND_SERVER_INTERVAL_MS = 5000UL; // thử tìm server mỗi 5s nếu chưa có
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 10000UL; // thử reconnect WiFi sau 10s

unsigned long lastSendMs = 0;
unsigned long lastFindServerMs = 0;
unsigned long lastWifiCheckMs = 0;

// ========== Helpers ==========
bool sv_is_on = false;

// ========== Prototypes ==========
void connectWiFi();
void ensureWiFi();
String findServerWithTimeout(unsigned long timeoutMs);
String httpGetRaw(const String &url, int &outCode);
String getDeviceStatus(const String &serverIp);
bool parseStatusJson(const String &json, String &statusOut);
void sendData(float temperature, float humidity, float pressure, float altitude);
bool readSensors(float &temperature, float &humidity, float &pressure, float &altitude);
IPAddress getSubnetBase();

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println();
  Serial.println("=== ESP32 Sensor Client (refactor) ===");

  dht.begin();

  if (!bmp.begin()) {
    Serial.println("❌ Không tìm thấy BMP180! Kiểm tra kết nối.");
    // Không block vô hạn: tiếp tục nhưng sẽ bỏ qua giá trị BMP nếu không có
  }

  connectWiFi();

  // Thử tìm server nhanh (không block lâu)
  serverIP = findServerWithTimeout(4000); // thử 4s
  if (serverIP != "") {
    Serial.println("📌 Server found: " + serverIP);
  } else {
    Serial.println("⚠️ Chưa tìm thấy server - sẽ thử lại trong loop.");
    lastFindServerMs = millis();
  }

  lastSendMs = millis();
  lastWifiCheckMs = millis();
}

void loop() {
  unsigned long now = millis();

  // 1) Kiểm tra WiFi (không quá thường xuyên)
  if (now - lastWifiCheckMs >= WIFI_RECONNECT_INTERVAL_MS) {
    lastWifiCheckMs = now;
    ensureWiFi();
  }

  // 2) Nếu chưa có server IP, thử tìm theo interval
  if (serverIP == "" && (now - lastFindServerMs >= FIND_SERVER_INTERVAL_MS)) {
    lastFindServerMs = now;
    Serial.println("🔍 Thử tìm server...");
    serverIP = findServerWithTimeout(8000); // thử 8s
    if (serverIP != "") Serial.println("🎯 Tìm thấy server: " + serverIP);
    else Serial.println("⚠️ Vẫn chưa tìm thấy server.");
  }

  // 3) Gửi data theo interval
  if (now - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = now;

    // Đọc sensor (có retry nhẹ)
    float temperature, humidity, pressure, altitude;
    bool ok = readSensors(temperature, humidity, pressure, altitude);

    // In ra debug
    Serial.println("========== SENSOR DATA ==========");
    if (ok) {
      Serial.print("🌡 Nhiệt độ: "); Serial.println(temperature);
      Serial.print("💧 Độ ẩm: ");   Serial.println(humidity);
      Serial.print("📦 Áp suất: "); Serial.println(pressure);
      Serial.print("⛰ Độ cao: ");   Serial.println(altitude);
    } else {
      Serial.println("⚠️ Đọc sensor không hợp lệ (NaN)");
    }

    // Lấy status server (nếu có serverIP)
    if (serverIP != "") {
      String jsonStatus = getDeviceStatus(serverIP);
      if (jsonStatus != "") {
        String statusStr;
        if (parseStatusJson(jsonStatus, statusStr)) {
          Serial.println("🔌 Trạng thái server trả về: " + statusStr);
          sv_is_on = (statusStr.equalsIgnoreCase("ON"));
        } else {
          Serial.println("⚠️ JSON status không parse được: " + jsonStatus);
        }
      } else {
        Serial.println("⚠️ Lỗi lấy status từ server.");
      }
    } else {
      Serial.println("⚠️ Chưa có server IP, bỏ qua lấy status.");
    }

    // Quyết định gửi
    if (!ok) {
      Serial.println("⚠️ Dữ liệu sensor không hợp lệ -> không gửi.");
    } else if (!sv_is_on) {
      Serial.println("⛔ Thiết bị bị tắt từ server -> không gửi dữ liệu.");
    } else {
      sendData(temperature, humidity, pressure, altitude);
    }

    Serial.println("=================================\n");
  }

  // Giữ loop mượt
  delay(10);
}


// ================= Implementation =================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("📶 Kết nối WiFi %s ...\n", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
    delay(200);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ Không thể kết nối WiFi (timeout).");
  }
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("⚠️ WiFi mất kết nối, thử reconnect...");
  WiFi.disconnect();
  connectWiFi();
}

// Trả về IP server (string) nếu tìm thấy, hoặc "" nếu không
String findServerWithTimeout(unsigned long timeoutMs) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Không tìm server vì chưa kết nối WiFi.");
    return "";
  }

  // Nếu bạn có URL cố định muốn thử trước (fast path), uncomment:
  // String fixed = "http://192.168.1.198:" + String(serverPort) + "/ping";
  // int code; String r = httpGetRaw(fixed, code); if (code == 200) return "192.168.1.198";

  unsigned long start = millis();
  IPAddress base = getSubnetBase(); // lấy 3 octet đầu của gateway/local IP
  if (base == (uint32_t)0) {
    // fallback: dùng localIP's subnet
    IPAddress lip = WiFi.localIP();
    base = IPAddress(lip[0], lip[1], lip[2], 0);
  }

  // Quét các host trong dải <base>.1 .. .254
  // Nhưng để giảm load, quét 1..254 với timeout giới hạn.
  for (int i = 1; i <= 254 && (millis() - start) < timeoutMs; i++) {
    IPAddress testIp = IPAddress(base[0], base[1], base[2], i);
    String url = "http://" + testIp.toString() + ":" + String(serverPort) + "/ping";

    int code;
    String resp = httpGetRaw(url, code);

    if (code == 200) {
      // tìm thấy
      return testIp.toString();
    }
    // nhanh delay nhỏ (để không spam tens of ms)
    delay(10);
  }

  return "";
}

// HTTP GET, trả về body (String). outCode chứa HTTP code (-1 nếu lỗi)
String httpGetRaw(const String &url, int &outCode) {
  HTTPClient http;
  String result = "";
  outCode = -1;
  http.begin(url);
  // set timeout (milliseconds) nếu bạn muốn (thư viện ESP32 HTTPClient có setTimeout)
  // http.setTimeout(2000);
  int code = http.GET();
  outCode = code;
  if (code > 0) {
    if (code == HTTP_CODE_OK || (code >= 200 && code < 300)) {
      result = http.getString();
    } else {
      result = http.getString(); // có thể chứa lỗi
    }
  } else {
    // code <= 0: lỗi kết nối
  }
  http.end();
  return result;
}

String getDeviceStatus(const String &serverIp) {
  if (serverIp == "") return "";

  String url = "http://" + serverIp + ":" + String(serverPort) + serverApiPathStatus + String(DEVICE_ID) + "/status";
  int httpCode;
  String payload = httpGetRaw(url, httpCode);
  if (httpCode == 200) return payload;
  return "";
}

// Parse JSON {"status":"ON"} or {"status":"OFF"}. Trả về true nếu parse thành công
bool parseStatusJson(const String &json, String &statusOut) {
  if (json.length() == 0) return false;
  // Dự đoán nhỏ gọn: chỉ cần vài bytes
  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    return false;
  }
  if (doc.containsKey("status")) {
    statusOut = String((const char*)doc["status"]);
    // trim spaces
    statusOut.trim();
    return true;
  }
  return false;
}

void sendData(float temperature, float humidity, float pressure, float altitude) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi chưa kết nối -> không gửi.");
    return;
  }
  if (serverIP == "") {
    Serial.println("⚠️ Chưa có server IP -> không gửi.");
    return;
  }

  String url = "http://" + serverIP + ":" + String(serverPort) + serverApiPathSend;
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Build JSON safely
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["device_name"] = DEVICE_NAME;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["altitude"] = altitude;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("✅ Gửi thành công, HTTP %d\n", httpCode);
  } else {
    Serial.printf("❌ Lỗi gửi: HTTP code %d\n", httpCode);
  }
  http.end();
}

// Đọc sensor với retry nhẹ (tránh NaN)
bool readSensors(float &temperature, float &humidity, float &pressure, float &altitude) {
  // DHT read (thử 2 lần nếu là NaN)
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    delay(200);
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
  }

  // BMP read (nếu module OK)
  if (bmp.begin()) {
    pressure = bmp.readPressure() / 100.0; // hPa
    altitude = bmp.readAltitude();
  } else {
    pressure = NAN;
    altitude = NAN;
  }

  bool ok = !(isnan(temperature) || isnan(humidity) || isnan(pressure) || isnan(altitude));
  return ok;
}

// lấy subnet base dựa trên gateway IP nếu có
IPAddress getSubnetBase() {
  IPAddress gw = WiFi.gatewayIP();
  if (gw[0] == 0 && gw[1] == 0 && gw[2] == 0 && gw[3] == 0) {
    // fallback: dùng localIP
    IPAddress lip = WiFi.localIP();
    return IPAddress(lip[0], lip[1], lip[2], 0);
  }
  return IPAddress(gw[0], gw[1], gw[2], 0);
}
