# Security Notes - Encrypter.ID

## Disclaimer

Encrypter.ID adalah project edukasi untuk tugas besar Keamanan Informasi. Semua fitur kriptografi menggunakan implementasi standar industri melalui Web Crypto API bawaan browser.

## Mengapa Hybrid Cryptography?

### AES Cocok untuk File Besar
- AES adalah algoritma symmetric encryption yang sangat cepat
- Dengan hardware AES-NI pada CPU modern, throughput bisa mencapai ratusan MB/s
- Mode GCM memberikan enkripsi sekaligus autentikasi (AEAD)
- Kunci 256-bit memberikan keamanan yang sangat tinggi
- Satu kunci digunakan untuk enkripsi dan dekripsi

### RSA Cocok untuk Mengamankan AES Key
- RSA adalah algoritma asymmetric encryption
- Menggunakan pasangan public key dan private key
- Public key bisa dibagikan secara terbuka
- Private key harus dijaga kerahasiaannya
- RSA lambat untuk data besar, tetapi AES key hanya 32 bytes
- RSA-OAEP dengan SHA-256 mencegah serangan chosen-ciphertext

### Kombinasi Keduanya
- AES mengenkripsi file (cepat, efisien untuk data besar)
- RSA mengenkripsi kunci AES (aman untuk key exchange)
- Hanya penerima dengan private key yang benar yang bisa membuka kunci AES
- Kunci AES baru di-generate untuk setiap sesi enkripsi

## Risiko Jika Private Key Bocor

Jika private key RSA bocor ke pihak yang tidak berwenang:

1. **Semua file terenkripsi yang menggunakan public key pasangannya bisa didekripsi** - Penyerang bisa membuka encrypted AES key dan kemudian mendekripsi file
2. **Riwayat komunikasi terancam** - Semua file yang pernah dienkripsi dengan key pair tersebut bisa dibuka
3. **Tidak ada forward secrecy** - Dalam implementasi ini, tidak ada mekanisme forward secrecy. Jika key pair dikompromikan, semua komunikasi masa lalu ikut terkompromikan
4. **Impersonasi** - Jika sistem menggunakan digital signature, penyerang bisa memalsukan identitas pemilik key

### Mitigasi
- Generate key pair baru secara berkala
- Simpan private key di tempat yang aman (jangan di cloud tanpa enkripsi)
- Jangan membagikan private key melalui channel yang tidak aman
- Gunakan password manager untuk menyimpan private key
- Dalam konteks aplikasi ini, private key hanya ada di memori browser dan hilang saat tab ditutup

## Brute Force Simulator

### Batasan Penting
- Simulator brute force pada Encrypter.ID HANYA menggunakan **dummy key kecil** (8-16 bit)
- **TIDAK** digunakan untuk membobol:
  - File pengguna yang dienkripsi dengan AES-256
  - Kunci RSA-2048 yang sebenarnya
  - Password atau kredensial apapun
  - Sistem atau layanan pihak ketiga
- Tujuan simulator: menunjukkan secara visual perbedaan waktu yang dibutuhkan untuk membobol kunci kecil vs kunci besar
- Kunci 8-bit (256 kemungkinan) bisa dipecahkan dalam milidetik
- Kunci AES-128 (3.4 x 10^38 kemungkinan) memerlukan waktu lebih lama dari usia alam semesta

## Catatan Implementasi

### Web Crypto API
- Semua operasi kriptografi menggunakan `window.crypto.subtle`
- Ini adalah implementasi native browser, bukan JavaScript murni
- Terjamin secara kriptografis dan sudah diaudit

### Randomness
- Semua random number menggunakan `crypto.getRandomValues()` (CSPRNG)
- IV untuk AES-GCM selalu 12 bytes random baru per enkripsi
- Kunci AES-256 menggunakan 32 bytes random

### Batasan Browser
- Web Crypto API memerlukan Secure Context (HTTPS atau localhost)
- File besar (>200MB) mungkin menyebabkan masalah memori
- `performance.memory` hanya tersedia di Chrome/Edge (V8 engine)
- Private key tidak disimpan secara persistent (hanya di memori browser)

## Referensi
- NIST SP 800-38D: Recommendation for GCM Mode
- RFC 3447: PKCS #1 RSA Cryptography Specifications
- W3C Web Cryptography API Specification
- NIST SP 800-57: Recommendation for Key Management
