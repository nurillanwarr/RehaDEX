# Dokumen Kebutuhan Sistem Keseluruhan (System Requirements Specification)
## Proyek Aplikasi Fisioterapi (Fokus: Pasien Stroke)

### 1. Pendahuluan
Dokumen ini merangkum secara keseluruhan kebutuhan sistem (System Requirements) untuk aplikasi pemantauan dan terapi fisioterapi. Sistem ini dirancang untuk menyatukan pencatatan profil medis pasien, sesi pemeriksaan, serta penerimaan data secara langsung (real-time) dari alat IoT fisioterapi. Sesuai kesepakatan, fokus utama pengembangan saat ini adalah untuk penanganan pasien dengan diagnosa **Stroke**.

### 2. Arsitektur Sistem Keseluruhan
Sistem menggunakan pendekatan berbasis *Client-Server* dengan integrasi ekosistem IoT. 
Alur sistem secara berurutan:
1. **Pasien / Alat Fisioterapi** berinteraksi dengan sensor yang ada pada alat.
2. **Sistem IoT (Dual System: Arduino & ESP)** membaca, memproses, dan mem-backup data.
3. **Koneksi Wi-Fi** mengirimkan data ke Server.
4. **Backend (API)** menerima, memvalidasi, dan meneruskan data.
5. **Database** menyimpan seluruh rekaman data profil dan riwayat sesi pengukuran.
6. **Frontend (Website)** menampilkan antarmuka *Dashboard* kepada tenaga medis atau operator.

### 3. Kebutuhan Perangkat Keras & IoT (Hardware Requirements)
Sistem menggunakan konsep **Dual System** sebagai bentuk *redundancy* (cadangan) dan pemisahan beban proses komputasi:
*   **Mikrokontroler 1 (Arduino - misal Uno/Mega):** Berfungsi sebagai otak utama pembacaan sensor secara presisi (analog/digital), mengontrol motor/aktuator terapi, dan bertindak sebagai sistem *backup* data lokal.
*   **Mikrokontroler 2 (ESP32/ESP8266):** Berfungsi sebagai modul komunikasi (IoT Node). Menerima data dari Arduino (misal via komunikasi Serial/I2C) lalu mengirimkannya dalam format JSON ke Backend Server melalui koneksi Wi-Fi (protokol HTTP POST).
*   **Ketentuan Pengukuran:** IoT harus mampu mengirimkan dan Backend mampu merekam progres dari **1 hingga 20 pengukuran (measurement) maksimal dalam 1 sesi terapi**.

### 4. Kebutuhan Antarmuka Pengguna (Frontend Requirements)
Tampilan antarmuka website (UI/UX) akan diadaptasi menyerupai gaya **MyAcademic UMS**, yang menitikberatkan pada desain yang bersih, formal, dan dominasi warna **Biru Akademik UMS dan Putih/Abu-abu** dengan tata letak *Sidebar Menu* dan *Card Dashboard*.

Fitur dan Halaman yang dibutuhkan (berdasarkan perancangan Canva):
1.  **Halaman Login / Identitas Awal:** 
    *   Form input Nama, Umur, dan Jenis Kelamin untuk registrasi awal atau identifikasi.
2.  **Dashboard Utama (Style MyAcademic):** 
    *   Menampilkan jumlah pasien aktif, perangkat IoT yang terhubung (status Online/Offline), serta progres bar pengukuran (contoh: *15/20 pengukuran selesai*).
3.  **Menu Diagnosa:**
    *   Pemilihan penyakit (Saat ini fitur yang diaktifkan hanya **Stroke**).
    *   Menampilkan **Siluet Tubuh Manusia** interaktif untuk memilih region yang terdampak (misal: *Hemiprase*). Siluet akan berubah warna pada bagian yang di-klik.
4.  **Menu Input Data (Pemeriksaan / Assesmen):**
    *   **Sejak:** Input kalender (Date picker) mulainya keluhan.
    *   **Deskripsi Rasa:** Pilihan ganda/dropdown kondisi yang dirasakan pasien.
    *   **Tanda-Tanda Vital (TTV):** Input nilai untuk Tekanan Darah, Suhu, dll.
    *   **Ashworth Scale per Region:** Input evaluasi spastisitas otot secara tradisional (manual).
    *   **Kuisioner Aktivitas Fungsional:** Mengkalkulasi skor kemandirian pasien.
5.  **Menu Mode Terapi:**
    *   Pemilihan instruksi mode penggunaan alat: **Fleksi**, **Ekstensi**, **Exercise** (Penguatan Otot), dan **Pengukuran**.
6.  **Menu Profil & Performa:**
    *   Menampilkan data diri pasien.
    *   Menampilkan **Grafik Peningkatan (Chart)** mingguan/bulanan dari Skor Fungsional (kuisioner) dan Kekuatan Otot (data IoT).
    *   Menu *Resiko* (sebagai *placeholder* untuk fitur identifikasi resiko jatuh di masa depan).

### 5. Kebutuhan Server & Database (Backend Requirements)
*   **Platform:** Node.js dengan framework Express.js.
*   **API Endpoints Inti (MVP):**
    *   `GET /api/health` : Pengecekan status server.
    *   `POST /api/devices/heartbeat`: Mengecek status perangkat (Last seen).
    *   `POST /api/measurements` : Endpoint utama untuk menerima pengiriman data dari ESP32.
    *   `GET /api/sessions/:session_id/measurements` : Mengambil data 20 rekaman dalam satu sesi untuk grafik.
*   **Database:** Basis data relasional (SQL) yang minimal memiliki struktur tabel berelasi: 
    *   `patients` (Data Pasien)
    *   `assessment_sessions` (Sesi Terapi)
    *   `devices` (Data Perangkat IoT)
    *   `measurements` (Data Pengukuran 1-20 dari IoT)

### 6. Keamanan, Batasan, dan Testing (Constraints & Security)
*   Sistem ini merupakan purwarupa (MVP) pencatatan untuk kebutuhan akademik/fisioterapi dasar dan **bukan alat pengambil keputusan medis otomatis**.
*   Sistem IoT tidak boleh di-hardcode ke `localhost`, melainkan diatur menggunakan alamat IPv4 lokal dari server/laptop tempat backend berjalan.
*   Akses ke Dashboard harus diamankan dengan otentikasi login, serta penggunaan file `.env` di backend agar kredensial database tidak bocor.
