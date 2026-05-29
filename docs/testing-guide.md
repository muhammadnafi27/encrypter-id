# Testing Guide - Encrypter.ID

## Overview

Panduan ini menjelaskan cara menguji semua fitur Encrypter.ID secara manual. Semua test dilakukan di browser.

---

## 1. Prerequisites

- **Browser**: Chrome 90+, Firefox 90+, Edge 90+, atau Safari 15+
- **RAM**: Minimal 4GB (8GB untuk test file 100MB)
- **Koneksi**: Tidak diperlukan (semua offline)

---

## 2. Test Scenarios

### Test 1: Encrypt → Decrypt Roundtrip (Functional Test)

**Tujuan**: Memastikan file yang dienkripsi dapat didekripsi kembali dengan benar.

**Langkah**:

1. Buka website dan navigasi ke **Encrypt**
2. Upload file apapun (contoh: gambar JPEG, dokumen PDF, file teks)
3. Klik **"Generate RSA Key Pair"** - tunggu status berubah hijau
4. Klik **"Generate AES Key"** - tunggu status berubah hijau
5. Klik **"Encrypt File"** - tunggu proses selesai
6. Klik **"Export Private Key"** - simpan file `private_key.pem`
7. Klik **"Download Encrypted Package"** - simpan file `.enc.json`
8. Navigasi ke **Decrypt**
9. Upload file `.enc.json` yang baru didownload
10. Klik **"Import .pem File"** dan pilih `private_key.pem`
11. Klik **"Validate Key"** - pastikan status hijau
12. Klik **"Decrypt File"** - tunggu proses selesai
13. Klik **"Download Original File"**

**Expected Result**:
- File yang didownload identik dengan file asli
- Ukuran file sama
- Konten file sama (bisa diverifikasi secara manual)
- Activity log menampilkan semua langkah

---

### Test 2: Transfer Simulation

**Langkah**:
1. (Opsional) Encrypt file terlebih dahulu di halaman Encrypt
2. Navigasi ke **Transfer**
3. Klik **"Start Simulation"**

**Expected Result**:
- Progress bar bergerak dari 0% ke 100%
- Status berubah: Preparing → Encrypting → Sending → Received
- Metadata transfer ditampilkan dengan benar
- Toast notification muncul saat selesai

---

### Test 3: Performance Benchmark

#### 3a. Individual Benchmark
**Langkah**:
1. Navigasi ke **Performance Lab**
2. Klik tombol **"1 MB"**
3. Tunggu benchmark selesai

**Expected Result**:
- Progress bar menunjukkan status
- Tabel menampilkan hasil: encrypt time, decrypt time, est. RAM, CPU score
- Chart ter-render dengan bar hijau (encrypt) dan lime (decrypt)

#### 3b. Multiple Benchmarks
**Langkah**:
1. Klik **"Run All (1, 5, 10 MB)"**
2. Tunggu semua benchmark selesai

**Expected Result**:
- Tabel menampilkan 3 baris hasil
- Chart menampilkan 3 grup bar
- Waktu meningkat secara proporsional dengan ukuran file

#### 3c. Large File Benchmark
**Langkah**:
1. Klik **"100 MB"**
2. Tunggu (bisa memakan waktu 10-60 detik)

**Expected Result**:
- Benchmark berhasil tanpa crash
- Hasil ditampilkan di tabel

**Catatan**:
- File 100MB memerlukan RAM signifikan
- Browser mungkin tampak tidak responsif sementara
- Jika browser kehabisan memori, akan muncul error

---

### Test 4: Security Demo (Brute Force Simulator)

**Langkah**:
1. Navigasi ke **Security Demo**
2. Pilih ukuran key dari dropdown (misal: 8-bit)
3. Klik **"Start Demo"**

**Expected Result** (8-bit key):
- Counter bertambah dari 0 hingga max 256
- Key ditemukan dalam waktu < 1 detik
- Status berubah ke "KEY FOUND!"
- Comparison cards menampilkan perbandingan waktu

**Test berbagai ukuran key**:
| Key Size | Max Keys | Expected Time |
|----------|----------|---------------|
| 8-bit | 256 | < 1 detik |
| 10-bit | 1,024 | < 1 detik |
| 12-bit | 4,096 | 1-3 detik |
| 16-bit | 65,536 | 5-30 detik |

---

### Test 5: Wrong Key Decryption

**Tujuan**: Memastikan dekripsi gagal jika menggunakan private key yang salah.

**Langkah**:
1. Encrypt file di halaman Encrypt
2. Download encrypted package
3. Navigasi ke **Encrypt** lagi
4. Generate **new** RSA key pair (kunci berbeda!)
5. Export private key baru
6. Navigasi ke **Decrypt**
7. Upload encrypted package dari langkah 2
8. Import private key baru (yang salah)
9. Klik **"Decrypt File"**

**Expected Result**:
- Dekripsi gagal
- Error message muncul: "Failed to decrypt AES key" atau "Decryption failed"
- Toast notification merah muncul
- File tidak bisa didownload

---

### Test 6: Navigation & Responsive

#### 6a. Desktop Navigation
**Langkah**:
1. Klik setiap menu di sidebar
2. Verifikasi halaman yang benar ditampilkan
3. Verifikasi highlight aktif di sidebar

#### 6b. Mobile Navigation
**Langkah**:
1. Resize browser ke < 768px (atau gunakan DevTools mobile mode)
2. Verifikasi bottom navigation muncul
3. Klik setiap tab di bottom nav
4. Verifikasi hamburger menu berfungsi
5. Verifikasi sidebar muncul saat hamburger diklik

**Expected Result**:
- Semua navigasi berfungsi
- Layout menyesuaikan ukuran layar
- Tidak ada overflow horizontal

---

### Test 7: Error Handling

#### 7a. Invalid File Format (Decrypt)
- Upload file non-JSON ke halaman Decrypt
- Expected: Error toast muncul

#### 7b. Invalid Private Key
- Paste teks random ke textarea private key
- Klik Validate
- Expected: Status menunjukkan "Invalid Key"

#### 7c. Empty State
- Klik Encrypt tanpa upload file
- Expected: Tombol disabled, tidak bisa diklik

---

## 3. Performance Interpretation

### Benchmark Metrics

| Metric | Deskripsi | Normal Range (1MB) |
|--------|-----------|-------------------|
| Encrypt Time | Total waktu enkripsi file + kunci | 10-100ms |
| Decrypt Time | Total waktu dekripsi kunci + file | 10-80ms |
| Est. RAM | Estimasi memori yang digunakan | ~3-5MB |
| CPU Score | Skor benchmark CPU sintetis | 500-5000 |

### Faktor yang Mempengaruhi Performa
1. **CPU speed** - Prosesor lebih cepat = benchmark lebih cepat
2. **Available RAM** - RAM terbatas dapat memperlambat file besar
3. **Browser** - Chrome biasanya paling cepat (V8 engine)
4. **Background processes** - Tab lain dapat mempengaruhi hasil
5. **Hardware acceleration** - AES-NI instruction set mempercepat AES

### Tips untuk Hasil Konsisten
- Tutup tab dan aplikasi lain
- Jalankan benchmark 3x dan ambil rata-rata
- Gunakan mode Incognito untuk mengurangi extension interference

---

## 4. Browser Compatibility Matrix

| Feature | Chrome 90+ | Firefox 90+ | Edge 90+ | Safari 15+ |
|---------|-----------|------------|----------|-----------|
| AES-GCM | ✅ | ✅ | ✅ | ✅ |
| RSA-OAEP | ✅ | ✅ | ✅ | ✅ |
| File API | ✅ | ✅ | ✅ | ✅ |
| Canvas | ✅ | ✅ | ✅ | ✅ |
| Clipboard API | ✅ | ✅ | ✅ | ✅ |
| performance.memory | ✅ | ❌ | ✅ | ❌ |
| Drag & Drop | ✅ | ✅ | ✅ | ✅ |

---

## 5. Known Limitations

1. File > 200MB mungkin menyebabkan browser crash (tergantung RAM)
2. `performance.memory` hanya tersedia di Chrome/Edge (V8 engine)
3. Beberapa browser memerlukan HTTPS/localhost untuk Web Crypto API
4. Kunci dan file tidak disimpan secara persistent - hilang saat tab ditutup
