#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <Adafruit_BMP085.h>

//===================== Cấu hình WiFi =====================
const char* ssid = "Oh yeah";
const char* password = "Tien2002";

//===================== DHT22 =====================
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

//===================== BMP180 ====================
Adafruit_BMP085 bmp;

// API Node.js
const char* serverName = "http://192.168.1.198:5000/api/sensordata";

// ID và tên thiết bị
const int DEVICE_ID = 1;
const char* DEVICE_NAME = "ESP32_LivingRoom";

void setup() {
  Serial.begin(115200);
  dht.begin();

  if (!bmp.begin()) {
    Serial.println("❌ Không tìm thấy BMP180!");
    while(1);
  }

  // Kết nối WiFi
  WiFi.begin(ssid, password);
  Serial.print("Đang kết nối WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi đã kết nối!");
}

void loop() {
  // Đọc dữ liệu
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  float pressure = bmp.readPressure() / 100.0; // hPa
  float altitude = bmp.readAltitude(); // m

  // Kiểm tra dữ liệu hợp lệ trước khi gửi
  if (!isnan(temperature) && !isnan(humidity) && !isnan(pressure) && !isnan(altitude)) {
    sendData(temperature, humidity, pressure, altitude);
  } else {
    Serial.println("⚠️ Dữ liệu không hợp lệ, bỏ qua gửi.");
  }

  delay(5000); // 5s
}

void sendData(float temperature, float humidity, float pressure, float altitude) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"device_id\":" + String(DEVICE_ID) + ",";
    jsonData += "\"device_name\":\"" + String(DEVICE_NAME) + "\",";
    jsonData += "\"temperature\":" + String(temperature) + ",";
    jsonData += "\"humidity\":" + String(humidity) + ",";
    jsonData += "\"pressure\":" + String(pressure) + ",";
    jsonData += "\"altitude\":" + String(altitude);
    jsonData += "}";

    int httpResponseCode = http.POST(jsonData);
    Serial.println(jsonData);

    if (httpResponseCode > 0) {
      Serial.print("✅ Dữ liệu gửi thành công: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("❌ Lỗi gửi dữ liệu: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("⚠️ WiFi chưa kết nối!");
  }
}
