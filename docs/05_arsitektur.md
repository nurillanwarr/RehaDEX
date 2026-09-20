# Arsitektur

Komponen:
1. Sensor/alat
2. ESP32
3. Wi-Fi/router/hotspot
4. Backend API
5. Database
6. Website
7. Operator

Prinsip:
- ESP32 mengirim data ke backend, bukan langsung ke database.
- Backend memvalidasi data.
- Database menyimpan data.
- Website membaca data dari backend.
- Satu session memiliki maksimal 20 measurement pada MVP.
