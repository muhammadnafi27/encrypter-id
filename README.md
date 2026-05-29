# Encrypter.ID

## Secure File Sharing with Hybrid Cryptography

Sistem keamanan file sharing berbasis **Hybrid Cryptography** menggunakan **AES-GCM** untuk enkripsi file dan **RSA-OAEP** untuk mengenkripsi kunci AES. Seluruh proses dilakukan di browser (client-side) menggunakan **Web Crypto API** — tidak ada data yang dikirim ke server.

---

## 🎯 Tujuan Sistem

1. Membangun sistem **file sharing terenkripsi** yang aman antara dua pihak (Alice → Bob)
2. Mengimplementasikan **Hybrid Cryptography** menggunakan standard industri (AES + RSA)
3. Mendemonstrasikan prinsip keamanan informasi secara interaktif dan edukatif
4. Menyediakan **Performance Lab** untuk mengukur performa enkripsi/dekripsi
5. Mengedukasi tentang keamanan enkripsi melalui **simulasi brute force** pada kunci kecil

---

## ✨ Fitur Utama

### 1. Landing Page
- Hero section dengan penjelasan hybrid cryptography
- Diagram alur visual: Alice → Encrypt → Transfer → Decrypt → Bob
- Feature cards: End-to-End Encryption, Zero Server Upload, Performance Lab

### 2. Dashboard Encrypt
- Drag & drop file upload
- Generate RSA-2048 key pair
- Generate AES-256 key
- Encrypt file dengan AES-GCM
- Export RSA keys dalam format PEM
- Download encrypted package (.enc.json)
- Activity log terminal style

### 3. Transfer Simulation
- Simulasi visual pengiriman file dari Alice ke Bob
- Progress bar dengan 4 tahap: Preparing → Encrypting → Sending → Received
- Metadata transfer: sender, receiver, filename, timestamp, file size

### 4. Decrypt & Download
- Upload encrypted package
- Import/paste RSA private key (PEM format)
- Validasi private key
- Dekripsi file
- Download file asli
- Decryption log

### 5. Performance Lab
- Benchmark enkripsi & dekripsi
- Generate test file: 1MB, 5MB, 10MB, 100MB
- Tabel hasil: waktu enkripsi, waktu dekripsi, estimasi RAM, CPU score
- Chart (Canvas) perbandingan encrypt vs decrypt time
- Pengukuran presisi menggunakan `performance.now()`

### 6. Security Demo
- Simulasi brute force untuk **dummy key kecil** (8-bit, 10-bit, 12-bit, 16-bit)
- Perbandingan waktu crack: dummy key vs AES-128 vs AES-256 vs RSA-2048
- Penjelasan keamanan AES-GCM dan RSA-OAEP

### 7. Documentation
- Alur kerja 7 langkah enkripsi/dekripsi
- Diagram alur visual
- Penjelasan teknis AES-GCM dan RSA-OAEP
- Security considerations

---

## 🛠 Teknologi yang Digunakan

| Teknologi | Penggunaan |
|-----------|------------|
| HTML5 | Struktur halaman |
| CSS3 | Styling, animasi, glassmorphism, responsive design |
| JavaScript (ES6+) | Logika aplikasi, event handling |
| Web Crypto API | AES-GCM, RSA-OAEP (native browser) |
| Canvas API | Rendering chart benchmark |
| File API | Membaca file untuk enkripsi |
| Blob API | Membuat dan download encrypted package |

**Tidak menggunakan framework atau library eksternal.**

---

## 🚀 Cara Menjalankan Project

### Metode 1: Langsung buka file
```
1. Buka file index.html di browser modern (Chrome, Firefox, Edge, Safari)
2. Website siap digunakan
```

### Metode 2: Menggunakan Live Server
```bash
# Jika menggunakan VS Code, install extension "Live Server"
# Klik kanan index.html → "Open with Live Server"
```

### Metode 3: Python HTTP Server
```bash
cd encrypter-id
python -m http.server 8000
# Buka http://localhost:8000
```

### Metode 4: Node.js HTTP Server
```bash
npx serve .
```

> ⚠️ Beberapa browser memerlukan HTTPS atau localhost untuk Web Crypto API.
> Jika tidak berfungsi saat membuka file secara langsung, gunakan live server.

---

## 📁 Struktur Folder

```
encrypter-id/
├── index.html              # Halaman utama SPA
├── README.md               # Dokumentasi project
├── assets/
│   ├── logo.svg            # Logo animasi SVG
│   └── icons/              # (SVG inline di HTML)
├── css/
│   ├── styles.css          # Design system + semua komponen
│   └── responsive.css      # Breakpoints mobile/tablet/desktop
├── js/
│   ├── app.js              # Router SPA, navigasi, event handler
│   ├── crypto.js           # Web Crypto API (AES-GCM, RSA-OAEP)
│   ├── ui.js               # Toast, terminal log, drag-drop, progress
│   ├── performance.js      # Benchmark engine, Canvas chart
│   ├── storage.js          # State management (in-memory)
│   └── utils.js            # Helper functions
└── docs/
    ├── architecture.md     # Arsitektur sistem
    └── testing-guide.md    # Panduan pengujian
```

---

## 🔐 Penjelasan AES + RSA (Hybrid Cryptography)

### Mengapa Hybrid?
- **AES** (symmetric) sangat cepat untuk mengenkripsi data besar
- **RSA** (asymmetric) aman untuk pertukaran kunci tapi lambat untuk data besar
- **Hybrid** menggabungkan keduanya: gunakan AES untuk file, RSA untuk mengamankan kunci AES

### Alur Enkripsi
```
1. Generate AES-256 key (random, unik per sesi)
2. Encrypt file data dengan AES-GCM → ciphertext + IV
3. Encrypt AES key dengan RSA Public Key penerima → encrypted key
4. Package: {ciphertext, IV, encrypted AES key, metadata}
```

### Alur Dekripsi
```
1. Penerima import RSA Private Key
2. Decrypt encrypted AES key dengan RSA Private Key → AES key
3. Decrypt ciphertext dengan AES-GCM + AES key + IV → file asli
4. GCM auth tag memverifikasi integritas
```

### Spesifikasi
| Parameter | Nilai |
|-----------|-------|
| AES Mode | GCM (Galois/Counter Mode) |
| AES Key Length | 256-bit |
| IV Length | 96-bit (12 bytes) |
| RSA Mode | OAEP |
| RSA Key Length | 2048-bit |
| RSA Hash | SHA-256 |
| Key Format Export | PEM (SPKI/PKCS8) |

---

## 📊 Cara Pengujian File (1MB, 5MB, 10MB, 100MB)

### Langkah Pengujian:
1. Buka halaman **Performance Lab** (klik "Lab" di navigasi)
2. Klik salah satu tombol ukuran file: **1 MB**, **5 MB**, **10 MB**, atau **100 MB**
3. Sistem akan:
   - Generate random binary file sesuai ukuran
   - Generate RSA key pair dan AES key
   - Mengukur waktu enkripsi (`performance.now()`)
   - Mengukur waktu dekripsi
   - Estimasi penggunaan RAM
   - Menghitung CPU benchmark score
4. Hasil ditampilkan di tabel dan chart

### Run All Benchmarks:
- Klik **"Run All (1, 5, 10 MB)"** untuk menjalankan benchmark berurutan
- Hasil ditampilkan dalam chart perbandingan

### Catatan 100MB:
- File 100MB memerlukan RAM yang cukup (minimal 1GB free RAM)
- Proses mungkin memakan waktu beberapa detik hingga menit
- Browser mungkin tampak "hang" sementara — ini normal

---

## 📈 Cara Membaca Hasil Performance

| Kolom | Keterangan |
|-------|------------|
| **File Size** | Ukuran file yang diuji |
| **Encrypt Time** | Waktu total enkripsi (AES encrypt + RSA key encrypt) |
| **Decrypt Time** | Waktu total dekripsi (RSA key decrypt + AES decrypt) |
| **Est. RAM** | Estimasi penggunaan memori (Chrome: `performance.memory`, lainnya: estimasi) |
| **CPU Score** | Skor benchmark CPU sintetis (lebih tinggi = lebih cepat) |

### Interpretasi Chart:
- **Bar hijau**: Waktu enkripsi
- **Bar lime**: Waktu dekripsi
- Dekripsi biasanya lebih cepat karena tidak perlu generate kunci
- Waktu meningkat secara linear seiring ukuran file

---

## ⚠️ Batasan Sistem

1. **Browser only** — memerlukan browser modern dengan Web Crypto API support
2. **File size** — dibatasi oleh RAM browser (max ~200MB untuk kebanyakan browser)
3. **Tidak persistent** — kunci dan file hilang saat tab ditutup (in-memory storage)
4. **Single file** — hanya mendukung satu file per enkripsi
5. **Tidak ada real transfer** — transfer hanya simulasi visual
6. **Tidak ada key management** — user harus menyimpan kunci secara manual
7. **Performance.memory** — hanya tersedia di Chrome (V8), browser lain menggunakan estimasi

---

## 🔒 Catatan Keamanan

### Brute Force Simulator
> ⚠️ **PENTING**: Fitur brute force simulator hanya untuk **demonstrasi edukatif**. 
> - Hanya menyerang **dummy key kecil** (8-bit hingga 16-bit) yang di-generate secara random dalam browser
> - **TIDAK** menyerang file asli, kunci AES asli, kunci RSA asli, password asli, atau sistem pihak ketiga
> - Tujuannya adalah menunjukkan bahwa kunci kecil mudah di-brute-force sedangkan kunci besar (128-bit, 256-bit, 2048-bit) secara komputasi tidak feasible

### Best Practices
- Jangan membagikan private key kepada siapapun
- Gunakan kunci RSA minimal 2048-bit (sudah default di sistem ini)
- IV selalu di-generate secara random untuk setiap enkripsi
- Pastikan browser dalam keadaan up-to-date

---

## 👨‍💻 Dibuat untuk

**Tugas Besar Keamanan Informasi**  
Sistem Keamanan File Sharing berbasis Hybrid Cryptography

© 2025 Encrypter.ID
