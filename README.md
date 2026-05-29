# Encrypter.ID

## Secure File Sharing with Hybrid Cryptography

**Encrypter.ID** adalah sebuah aplikasi web interaktif berbasis client-side yang dirancang untuk mensimulasikan dan mengimplementasikan sistem pengiriman file secara aman (Secure File Sharing) menggunakan metode **Hybrid Cryptography**. Aplikasi ini memanfaatkan kekuatan enkripsi simetris (AES) untuk mengamankan konten file dan enkripsi asimetris (RSA) untuk mendistribusikan kunci secara aman.

Proyek ini dibuat dan dikembangkan khusus sebagai **Tugas Mata Kuliah Keamanan Komputer**.

---

## 🎓 Konteks Proyek Keamanan Komputer

* **Mata Kuliah:** Keamanan Komputer / Keamanan Informasi
* **Topik Utama:** Kriptografi Hibrida (Hybrid Cryptography), Manajemen Kunci, Kriptografi di Sisi Klien (Client-Side Cryptography), dan Analisis Performa Algoritma Kriptografi.
* **Tujuan Akademik:** 
  1. Mengimplementasikan konsep teori kriptografi ke dalam aplikasi web nyata secara interaktif.
  2. Menganalisis efisiensi dan performa algoritma simetris dan asimetris melalui simulasi langsung.
  3. Menguji ketahanan enkripsi terhadap serangan Brute Force pada panjang kunci yang bervariasi secara edukatif.

---

## 🔐 Konsep Hybrid Cryptography di Encrypter.ID

Dalam keamanan data, enkripsi simetris dan asimetris memiliki keunggulan dan kelemahan masing-masing:
* **AES-256-GCM** (Simetris): Sangat cepat dan efisien dalam memproses data berukuran besar, namun memerlukan metode pertukaran kunci yang aman agar pengirim dan penerima memiliki kunci yang sama.
* **RSA-OAEP 2048-bit** (Asimetris): Menggunakan pasangan kunci publik (untuk enkripsi) dan kunci privat (untuk dekripsi). Sangat aman untuk pertukaran kunci tanpa perlu berbagi rahasia terlebih dahulu, namun sangat lambat jika digunakan untuk mengenkripsi file berukuran besar.

**Sistem Kriptografi Hibrida** menggabungkan keduanya:
1. **Enkripsi File:** File dienkripsi menggunakan kunci simetris AES-256-GCM yang di-generate secara acak dan unik untuk setiap sesi.
2. **Proteksi Kunci:** Kunci AES tersebut kemudian dienkripsi menggunakan kunci publik RSA-OAEP milik penerima.
3. **Paket Data:** Pengirim menggabungkan file yang terenkripsi (ciphertext), Initialization Vector (IV), kunci AES yang terenkripsi, dan metadata menjadi satu file paket aman `.enc.json`.
4. **Dekripsi:** Penerima menggunakan kunci privat RSA-OAEP miliknya untuk mendekripsi kunci AES, lalu menggunakan kunci AES tersebut untuk mendekripsi file asli.

---

## ✨ Fitur Utama Sistem

### 1. Landing Page / Overview
* Tampilan bergaya cyber security modern dengan latar belakang video futuristik (`assets/background.mp4`) berpadu dengan efek glassmorphism yang premium.
* Dashboard interaktif yang menjelaskan skema alur pengiriman file terenkripsi secara visual.

### 2. Encrypt Lab
* Area drag and drop interaktif untuk mengunggah file yang ingin dienkripsi.
* Pembuatan pasangan kunci RSA-2048 (Public & Private Key) secara langsung di browser.
* Ekspor kunci ke dalam format standar PEM (`.pem` format) yang aman.
* Kompresi data dan pembuatan paket enkripsi terenkapsulasi `.enc.json`.
* Terminal log real-time bergaya konsol hacker untuk memantau detail proses kriptografi.

### 3. Transfer Simulation
* Simulasi visual interaktif pengiriman paket data terenkripsi dari pihak pengirim (Alice) ke pihak penerima (Bob).
* Progress bar real-time yang menunjukkan langkah demi langkah persiapan, pengenkripsian, pengiriman jaringan virtual, hingga penerimaan paket.

### 4. Decrypt Lab
* Form untuk mengunggah paket file terenkripsi `.enc.json`.
* Input kunci privat RSA PEM penerima untuk melakukan otorisasi dekripsi.
* Sistem dekripsi instan yang mengembalikan file ke format aslinya tanpa kehilangan data.
* Peringatan keamanan otomatis jika kunci privat yang dimasukkan salah atau jika file telah dimodifikasi (menggunakan fitur integritas data AES-GCM).

### 5. Performance Lab (Benchmark)
* Pengujian performa enkripsi dan dekripsi menggunakan data acak berukuran bervariasi (1 MB, 5 MB, 10 MB, 100 MB).
* Dukungan pemilihan beberapa ukuran file secara bersamaan menggunakan chip interaktif.
* Pengukuran waktu presisi tinggi dengan `performance.now()`.
* Visualisasi grafik perbandingan performa menggunakan Canvas API.
* Analisis memori (RAM) dan perhitungan skor kinerja CPU secara dinamis.

### 6. Security & Brute Force Demo
* Simulator serangan Brute Force terhadap kunci dummy berukuran kecil (8-bit, 10-bit, 12-bit, dan 16-bit) untuk menunjukkan bagaimana serangan pencarian kunci bekerja secara sistematis.
* Menampilkan estimasi waktu crack secara matematis untuk membandingkan kunci dummy dengan standar enkripsi modern seperti AES-128, AES-256, dan RSA-2048.
* Memberikan pemahaman edukatif mengenai pentingnya panjang kunci dalam menjaga kerahasiaan data dari ancaman komputasi superkomputer.

### 7. Interactive Documentation
* Penjelasan teknis alur enkripsi dan dekripsi yang dibagi menjadi 7 langkah terperinci.
* Rekomendasi standar keamanan untuk implementasi di dunia nyata.

---

## 🛠 Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan teknologi native web modern tanpa bergantung pada library atau framework eksternal untuk menjamin performa murni dan kemudahan dalam audit kode:

1. **Struktur:** HTML5 dengan markup semantik untuk SEO dan aksesibilitas.
2. **Tampilan & Animasi:** CSS3 Vanilla dengan variabel dinamis, efek glassmorphism modern, desain responsif (mobile-friendly), dan pemutar video latar belakang terintegrasi.
3. **Logika & Kriptografi:** JavaScript murni (ES6+ Modules) yang modular.
4. **Mesin Kriptografi:** **Web Crypto API (SubtleCrypto)**, standar resmi browser modern untuk pengolahan kunci, enkripsi, dekripsi, dan tanda tangan digital dengan performa tinggi yang dioptimalkan di tingkat sistem operasi.
5. **Visualisasi Data:** Canvas API untuk rendering chart performa benchmark secara dinamis.

---

## 📁 Struktur Kode Proyek

```text
encrypter-id/
├── index.html              # File utama Single Page Application (SPA)
├── README.md               # Dokumentasi utama proyek (file ini)
├── assets/
│   ├── logo.svg            # Logo animasi SVG ikonik
│   └── background.mp4      # Video latar belakang futuristik
├── css/
│   ├── styles.css          # Design system, layout dasar, dan komponen visual
│   └── responsive.css      # Aturan visual responsif untuk tablet dan mobile
└── js/
    ├── app.js              # Router SPA, event handler, dan inisialisasi menu
    ├── crypto.js           # Core engine Web Crypto API (AES-GCM & RSA-OAEP)
    ├── ui.js               # Pengolahan visual UI, terminal log, drag-drop, toast
    ├── performance.js      # Algoritma benchmark performance lab & grafik Canvas
    ├── storage.js          # Pengelolaan state data aplikasi secara in-memory
    └── utils.js            # Fungsi helper konversi tipe data, format size, dan hex
```

---

## 🚀 Panduan Menjalankan Proyek

Web Crypto API membutuhkan lingkungan yang aman agar dapat berjalan secara penuh di browser. Browser modern melarang penggunaan fungsi kriptografi tingkat tinggi pada protokol HTTP biasa, kecuali pada alamat `localhost` atau `127.0.0.1`.

### Cara 1: Menggunakan VS Code Live Server (Rekomendasi)
1. Buka folder proyek ini di Visual Studio Code.
2. Pastikan extension **Live Server** sudah terinstall.
3. Klik kanan pada file `index.html` dan pilih **Open with Live Server**.
4. Aplikasi akan otomatis terbuka di browser Anda pada alamat `http://127.0.0.1:5500`.

### Cara 2: Menggunakan Server HTTP Python
Jika Anda telah menginstall Python di komputer Anda, jalankan perintah berikut di terminal:
```bash
python -m http.server 8000
```
Buka browser dan akses alamat `http://localhost:8000`.

### Cara 3: Menggunakan Serve Node.js
Jika Anda memiliki Node.js, Anda dapat menggunakan modul serve:
```bash
npx serve .
```
Buka browser pada alamat yang diberikan oleh program tersebut.

---

## 📊 Detail Algoritma & Parameter Kriptografi

Untuk memenuhi standar keamanan akademis dan industri, parameter berikut digunakan di dalam sistem ini:

| Parameter | Spesifikasi | Deskripsi |
|-----------|-------------|-----------|
| **Algoritma Simetris** | AES-GCM (Galois/Counter Mode) | Dipilih karena mendukung Authenticated Encryption (enkripsi sekaligus verifikasi integritas data secara bersamaan). |
| **Panjang Kunci AES** | 256-bit | Standar enkripsi militer yang sangat aman dari serangan komputasi masa kini. |
| **Initialization Vector (IV)** | 96-bit (12 bytes) acak | Digenerate menggunakan `crypto.getRandomValues()` untuk menjamin keamanan AES-GCM pada setiap enkripsi baru. |
| **Algoritma Asimetris** | RSA-OAEP (Optimal Asymmetric Encryption Padding) | Standar enkripsi asimetris modern yang tahan terhadap serangan tebakan teks asal. |
| **Panjang Kunci RSA** | 2048-bit | Panjang kunci minimum yang direkomendasikan industri saat ini untuk pertukaran kunci. |
| **Fungsi Hash RSA** | SHA-256 | Algoritma hashing aman untuk fungsi padding OAEP. |
| **Format Ekspor Kunci** | PEM (SPKI untuk kunci publik, PKCS8 untuk kunci privat) | Format standar berbasis teks base64 yang mudah disalin dan disimpan oleh pengguna. |

---

## ⚠️ Batasan Sistem (Sifat Edukatif)

Aplikasi ini dirancang sebagai media pembelajaran interaktif untuk tugas kuliah, sehingga memiliki beberapa batasan fungsional:
1. **Penyimpanan In-Memory:** Kunci dan data yang di-generate tidak disimpan secara persisten di server untuk menjaga privasi mutlak. Jika halaman web di-refresh, data in-memory akan hilang.
2. **Kapasitas Ukuran File:** Karena seluruh enkripsi dilakukan di dalam memori RAM browser menggunakan tipe data ArrayBuffer, ukuran file ideal yang dienkripsi adalah di bawah 150-200 MB (tergantung spesifikasi perangkat pengguna) guna mencegah kegagalan alokasi memori browser.
3. **Simulasi Jaringan:** Tahap pengiriman file pada menu **Transfer** adalah simulasi visual guna menggambarkan konsep pengiriman data antar pihak secara visual tanpa adanya pengunggahan file ke server luar.

---

## 🔒 Pernyataan Keamanan & Etika (Disclaimer)

* **Demo Brute Force:** Fitur Brute Force Simulator dibuat murni untuk tujuan edukasi keamanan komputer. Simulator ini hanya mencoba memecahkan kunci dummy berukuran sangat kecil yang dibuat secara dinamis di dalam sandbox memori browser, tidak melakukan peretasan nyata pada perangkat ataupun data user yang asli.
* **Tanpa Upload Server:** Aplikasi ini menjamin 100% kerahasiaan data karena tidak ada satu pun byte dari file Anda yang diunggah ke internet. Semua proses pemrosesan data terjadi secara lokal di dalam browser Anda.

---

**© 2026 Encrypter.ID. All Rights Reserved.**
