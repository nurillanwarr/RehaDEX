# Cara Menjalankan

## Backend
```bash
cd backend
npm install
node server.js
```

Tes:
`http://localhost:3000/api/health`

## Frontend
Buka `frontend/index.html` atau jalankan static server.

## ESP32
1. Masukkan nama Wi-Fi.
2. Masukkan password.
3. Jalankan `ipconfig` di laptop.
4. Ambil IPv4 laptop.
5. Masukkan IP tersebut ke `API_URL` pada file ESP32.
6. Pastikan ESP32 dan laptop berada pada Wi-Fi yang sama.
7. Upload program.
