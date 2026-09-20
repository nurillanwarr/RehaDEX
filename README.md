# Stroke IoT Website — MVP

Rancangan MVP untuk integrasi alat pemeriksaan pasien stroke dengan website.

Alur:
Pasien → Sensor/alat → ESP32 → Wi-Fi → Backend → Database → Website.

Satu pasien dapat memiliki satu sesi pemeriksaan dengan maksimal 20 pengukuran.

Stack contoh:
- ESP32
- Wi-Fi
- HTTP REST
- Node.js + Express
- PostgreSQL
- HTML/CSS/JavaScript

Catatan: ini prototipe akademik, bukan alat diagnosis medis.
