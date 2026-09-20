# API Contract MVP

Base URL contoh: `http://IP-LAPTOP:3000`

GET `/api/health`

POST `/api/devices/heartbeat`
```json
{"device_id":"ESP32-STROKE-01"}
```

POST `/api/measurements`
```json
{
  "patient_id":"STK-001",
  "session_id":"SES-001",
  "device_id":"ESP32-STROKE-01",
  "heart_rate":78,
  "spo2":97,
  "temperature":36.7
}
```

GET `/api/sessions/:session_id/measurements`
