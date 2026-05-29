# Architecture — Encrypter.ID

## System Overview

Encrypter.ID adalah Single Page Application (SPA) yang berjalan sepenuhnya di browser tanpa backend. Semua operasi kriptografi menggunakan **Web Crypto API** bawaan browser.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client-Side)                       │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ index.   │    │ css/     │    │ js/      │    │ assets/  │      │
│  │ html     │    │ styles   │    │ modules  │    │ logo.svg │      │
│  └─────┬────┘    └──────────┘    └────┬─────┘    └──────────┘      │
│        │                              │                             │
│  ┌─────▼──────────────────────────────▼─────────────────────────┐  │
│  │                    JavaScript Runtime                         │  │
│  │                                                               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐    │  │
│  │  │ app.js  │  │ ui.js   │  │ utils.js│  │ storage.js   │    │  │
│  │  │ Router  │  │ Toast   │  │ Helpers │  │ State Mgmt   │    │  │
│  │  │ Events  │  │ Log     │  │ Format  │  │ In-Memory    │    │  │
│  │  │ Nav     │  │ DragDrop│  │ PEM     │  │              │    │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └──────────────┘    │  │
│  │                                                               │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐  │  │
│  │  │      crypto.js           │  │    performance.js         │  │  │
│  │  │                          │  │                           │  │  │
│  │  │  ┌─────────────────┐     │  │  ┌──────────────────┐    │  │  │
│  │  │  │   AES-GCM 256   │     │  │  │ Benchmark Engine │    │  │  │
│  │  │  │   File Encrypt  │     │  │  │ performance.now()│    │  │  │
│  │  │  │   File Decrypt  │     │  │  │ Canvas Chart     │    │  │  │
│  │  │  └─────────────────┘     │  │  │ CPU Scoring      │    │  │  │
│  │  │                          │  │  └──────────────────┘    │  │  │
│  │  │  ┌─────────────────┐     │  │                           │  │  │
│  │  │  │  RSA-OAEP 2048  │     │  └──────────────────────────┘  │  │
│  │  │  │  Key Exchange   │     │                                 │  │
│  │  │  │  PEM Import/    │     │                                 │  │
│  │  │  │  Export         │     │                                 │  │
│  │  │  └─────────────────┘     │                                 │  │
│  │  │                          │                                 │  │
│  │  │  ┌─────────────────┐     │                                 │  │
│  │  │  │ Package Creator │     │                                 │  │
│  │  │  │ JSON Blob       │     │                                 │  │
│  │  │  └─────────────────┘     │                                 │  │
│  │  └──────────────────────────┘                                 │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │              Web Crypto API (Native Browser)            │   │  │
│  │  │  window.crypto.subtle                                   │   │  │
│  │  │  • generateKey()  • encrypt()  • decrypt()             │   │  │
│  │  │  • exportKey()    • importKey()                         │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Browser APIs Used                          │   │
│  │  • FileReader / File API (read uploaded files)               │   │
│  │  • Blob API (create downloadable packages)                   │   │
│  │  • Canvas API (render charts)                                │   │
│  │  • Clipboard API (copy keys)                                 │   │
│  │  • URL.createObjectURL (file downloads)                      │   │
│  │  • performance.now() (high-precision timing)                 │   │
│  │  • performance.memory (Chrome memory info)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────┐                                    │
│  │   NO SERVER COMMUNICATION  │                                    │
│  │   Everything runs locally  │                                    │
│  └────────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Module Dependency Graph

```
utils.js          ← No dependencies (loaded first)
    ↑
storage.js        ← Depends on: utils.js
    ↑
crypto.js         ← Depends on: utils.js, storage.js
    ↑
ui.js             ← Depends on: utils.js, storage.js
    ↑
performance.js    ← Depends on: utils.js, ui.js, crypto.js, storage.js
    ↑
app.js            ← Depends on: ALL modules above
```

## Data Flow

### Encryption Flow
```
[User selects file]
        │
        ▼
[File → ArrayBuffer]  (File API)
        │
        ▼
[Generate AES-256 key]  (crypto.subtle.generateKey)
        │
        ▼
[Generate RSA-2048 keypair]  (crypto.subtle.generateKey)
        │
        ▼
[Encrypt file with AES-GCM]  (crypto.subtle.encrypt)
        │ → Produces: ciphertext + IV (96-bit)
        ▼
[Encrypt AES key with RSA pub]  (crypto.subtle.encrypt)
        │ → Produces: encrypted AES key (256 bytes)
        ▼
[Create JSON package]
        │ → {metadata, encryptedAESKey, iv, ciphertext}
        ▼
[Download as .enc.json]  (Blob + URL.createObjectURL)
```

### Decryption Flow
```
[User uploads .enc.json]
        │
        ▼
[Parse JSON package]
        │
        ▼
[User imports RSA private key]  (PEM format)
        │
        ▼
[Import private key]  (crypto.subtle.importKey)
        │
        ▼
[Decrypt AES key with RSA priv]  (crypto.subtle.decrypt)
        │ → Produces: raw AES key (32 bytes)
        ▼
[Import AES key]  (crypto.subtle.importKey)
        │
        ▼
[Decrypt ciphertext with AES-GCM]  (crypto.subtle.decrypt)
        │ → Produces: original file data
        ▼
[Download original file]  (Blob + URL.createObjectURL)
```

## Encrypted Package Format (JSON)

```json
{
    "format": "encrypter-id-v1",
    "timestamp": "2025-01-15 14:30:22",
    "metadata": {
        "originalFilename": "document.pdf",
        "originalSize": 1048576,
        "originalType": "application/pdf",
        "sender": "Alice",
        "receiver": "Bob",
        "encryptedFilename": "a1b2c3d4.enc"
    },
    "encryptedAESKey": "<base64>",
    "iv": "<base64>",
    "ciphertext": "<base64>"
}
```

## State Management

All application state is stored in-memory using the `Storage` module:

```
Storage.state = {
    currentFile        → { name, size, type, file }
    rsaKeyPair         → { publicKey, privateKey }
    aesKey             → CryptoKey
    rsaPublicKeyPEM    → PEM string
    rsaPrivateKeyPEM   → PEM string
    encryptionResult   → { ciphertext, iv, encryptedAESKey }
    encryptedPackage   → Blob
    importedPrivateKey → CryptoKey
    decryptedFile      → { data, name, type }
    transferState      → { status, progress, metadata }
    benchmarkResults   → [{ fileSize, encryptTime, ... }]
    activityLog        → [{ timestamp, message, type }]
    bruteForceState    → { running, keyBits, attempts, ... }
}
```

No persistent storage is used — all data is lost when the tab is closed.

## Security Model

1. **No network requests** — All operations are local
2. **Web Crypto API** — Uses browser-native cryptographic primitives (not JS implementations)
3. **Random key generation** — Using `crypto.getRandomValues()` (CSPRNG)
4. **AEAD** — GCM mode provides both confidentiality and integrity
5. **Fresh IV** — New random IV for every encryption operation
6. **Key isolation** — Private keys never leave the browser
