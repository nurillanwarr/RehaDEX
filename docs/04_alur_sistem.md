# Alur Sistem

```text
Sensor/alat
   ↓
ESP32
   ↓ Wi-Fi
Router / Hotspot
   ↓
Backend di laptop/server
   ↓
Database
   ↓
Website
```

Contoh satu laptop:
- Laptop IP: 192.168.1.10
- Website: port 5173
- Backend: port 3000

ESP32 mengirim ke:
http://192.168.1.10:3000/api/measurements

Jangan gunakan `localhost` pada ESP32 karena `localhost` berarti perangkat ESP32 itu sendiri.

Jika backend berada di laptop lain, ESP32 menggunakan IP laptop yang menjalankan backend.
