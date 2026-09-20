# Testing

T1 Wi-Fi: ESP32 mendapat IP.

T2 Backend: `/api/health` berhasil.

T3 ESP32 → Backend: 1 data diterima.

T4 20 pengukuran: nomor 1–20 tersimpan dalam session yang sama.

T5 Data invalid: backend menolak format wajib yang kosong/salah.

T6 Multi-session: data tidak bercampur.

T7 Dashboard: data sesuai database.

T8 Reconnect: ESP32 dapat kembali mengirim setelah Wi-Fi tersambung.
