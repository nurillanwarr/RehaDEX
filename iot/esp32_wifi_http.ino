#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "NAMA_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// Ganti dengan IPv4 LAPTOP yang menjalankan backend.
// Contoh: http://192.168.1.10:3000/api/measurements
const char* API_URL = "http://192.168.1.10:3000/api/measurements";
const char* DEVICE_ID = "ESP32-STROKE-01";

void connectWiFi(){
  WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
  Serial.print("Menghubungkan Wi-Fi");
  while(WiFi.status()!=WL_CONNECTED){delay(500);Serial.print(".");}
  Serial.println("\nWi-Fi terhubung");
  Serial.print("IP ESP32: "); Serial.println(WiFi.localIP());
}

void sendMeasurement(float hr,float spo2,float temp){
  if(WiFi.status()!=WL_CONNECTED) connectWiFi();
  HTTPClient http; http.begin(API_URL);
  http.addHeader("Content-Type","application/json");
  String json=String("{")+
    "\"patient_id\":\"STK-001\","+
    "\"session_id\":\"SES-001\","+
    "\"device_id\":\""+DEVICE_ID+"\","+
    "\"heart_rate\":"+String(hr,1)+","+
    "\"spo2\":"+String(spo2,1)+","+
    "\"temperature\":"+String(temp,1)+"}";
  int code=http.POST(json);
  Serial.print("HTTP status: "); Serial.println(code);
  Serial.println(http.getString());
  http.end();
}

void setup(){
  Serial.begin(115200);
  connectWiFi();
  // Data dummy untuk pengujian. Nantinya diganti data sensor.
  sendMeasurement(78,97,36.7);
}
void loop(){}
