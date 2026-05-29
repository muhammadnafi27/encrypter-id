const Crypto = (() => {
    'use strict';

    // =============================================
    // Constants
    // =============================================
    const RSA_KEY_LENGTH = 2048;
    const AES_KEY_LENGTH = 256;
    const RSA_ALGORITHM = {
        name: 'RSA-OAEP',
        modulusLength: RSA_KEY_LENGTH,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256'
    };
    const AES_ALGORITHM = {
        name: 'AES-GCM',
        length: AES_KEY_LENGTH
    };

    // =============================================
    // Key Generation
    // =============================================

    /**
     * Generate an RSA-OAEP key pair (2048-bit)
     * Public key for encryption, Private key for decryption
     * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
     */
    async function generateRSAKeyPair() {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                RSA_ALGORITHM,
                true, // extractable — needed to export keys
                ['encrypt', 'decrypt'] // wrapKey/unwrapKey also possible but encrypt/decrypt is clearer
            );

            Storage.addLogEntry('[RSA] Generated 2048-bit RSA-OAEP key pair', 'success');
            return keyPair;
        } catch (error) {
            Storage.addLogEntry(`[RSA] Key generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate an AES-GCM key (256-bit)
     * Used for symmetric encryption of file data
     * @returns {Promise<CryptoKey>}
     */
    async function generateAESKey() {
        try {
            const key = await window.crypto.subtle.generateKey(
                AES_ALGORITHM,
                true, // extractable — needed for RSA wrapping
                ['encrypt', 'decrypt']
            );

            Storage.addLogEntry('[AES] Generated 256-bit AES-GCM key', 'success');
            return key;
        } catch (error) {
            Storage.addLogEntry(`[AES] Key generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // =============================================
    // Key Export / Import
    // =============================================

    /**
     * Export RSA public key to PEM format (SPKI)
     * @param {CryptoKey} publicKey - RSA public key
     * @returns {Promise<string>} PEM formatted public key
     */
    async function exportPublicKey(publicKey) {
        const exported = await window.crypto.subtle.exportKey('spki', publicKey);
        const pem = Utils.arrayBufferToPEM(exported, 'PUBLIC');
        Storage.addLogEntry('[RSA] Exported public key to PEM format', 'info');
        return pem;
    }

    /**
     * Export RSA private key to PEM format (PKCS8)
     * @param {CryptoKey} privateKey - RSA private key
     * @returns {Promise<string>} PEM formatted private key
     */
    async function exportPrivateKey(privateKey) {
        const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
        const pem = Utils.arrayBufferToPEM(exported, 'PRIVATE');
        Storage.addLogEntry('[RSA] Exported private key to PEM format', 'info');
        return pem;
    }

    /**
     * Import RSA public key from PEM format
     * @param {string} pem - PEM formatted public key
     * @returns {Promise<CryptoKey>}
     */
    async function importPublicKey(pem) {
        try {
            const keyData = Utils.pemToArrayBuffer(pem);
            const key = await window.crypto.subtle.importKey(
                'spki',
                keyData,
                { name: 'RSA-OAEP', hash: 'SHA-256' },
                true,
                ['encrypt']
            );
            Storage.addLogEntry('[RSA] Imported public key from PEM', 'success');
            return key;
        } catch (error) {
            Storage.addLogEntry(`[RSA] Public key import failed: ${error.message}`, 'error');
            throw new Error('Invalid public key format. Please check the PEM data.');
        }
    }

    /**
     * Import RSA private key from PEM format
     * @param {string} pem - PEM formatted private key
     * @returns {Promise<CryptoKey>}
     */
    async function importPrivateKey(pem) {
        try {
            const keyData = Utils.pemToArrayBuffer(pem);
            const key = await window.crypto.subtle.importKey(
                'pkcs8',
                keyData,
                { name: 'RSA-OAEP', hash: 'SHA-256' },
                true,
                ['decrypt']
            );
            Storage.addLogEntry('[RSA] Imported private key from PEM', 'success');
            return key;
        } catch (error) {
            Storage.addLogEntry(`[RSA] Private key import failed: ${error.message}`, 'error');
            throw new Error('Invalid private key format. Please check the PEM data.');
        }
    }

    /**
     * Export AES key to Base64
     * @param {CryptoKey} aesKey - AES key
     * @returns {Promise<string>} Base64 encoded key
     */
    async function exportAESKey(aesKey) {
        const exported = await window.crypto.subtle.exportKey('raw', aesKey);
        return Utils.arrayBufferToBase64(exported);
    }

    /**
     * Import AES key from Base64
     * @param {string} base64Key - Base64 encoded key
     * @returns {Promise<CryptoKey>}
     */
    async function importAESKey(base64Key) {
        const keyData = Utils.base64ToArrayBuffer(base64Key);
        return await window.crypto.subtle.importKey(
            'raw',
            keyData,
            AES_ALGORITHM,
            true,
            ['encrypt', 'decrypt']
        );
    }

    // =============================================
    // Encryption
    // =============================================

    /**
     * Encrypt file data with AES-GCM
     * @param {ArrayBuffer} fileData - File content as ArrayBuffer
     * @param {CryptoKey} aesKey - AES-GCM key
     * @returns {Promise<{ciphertext: ArrayBuffer, iv: Uint8Array}>}
     */
    async function encryptFile(fileData, aesKey) {
        try {
            // Generate random IV (96-bit recommended for GCM)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            Storage.addLogEntry(`[AES] Encrypting ${Utils.formatFileSize(fileData.byteLength)} of data...`, 'info');

            const ciphertext = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                fileData
            );

            Storage.addLogEntry(`[AES] File encrypted successfully. Ciphertext: ${Utils.formatFileSize(ciphertext.byteLength)}`, 'success');

            return { ciphertext, iv };
        } catch (error) {
            Storage.addLogEntry(`[AES] Encryption failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Encrypt AES key with RSA public key
     * @param {CryptoKey} aesKey - AES key to encrypt
     * @param {CryptoKey} rsaPublicKey - RSA public key
     * @returns {Promise<ArrayBuffer>} Encrypted AES key
     */
    async function encryptAESKey(aesKey, rsaPublicKey) {
        try {
            // Export AES key to raw format first
            const rawAESKey = await window.crypto.subtle.exportKey('raw', aesKey);

            // Encrypt with RSA-OAEP
            const encryptedKey = await window.crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                rsaPublicKey,
                rawAESKey
            );

            Storage.addLogEntry('[RSA] AES key encrypted with RSA public key', 'success');
            return encryptedKey;
        } catch (error) {
            Storage.addLogEntry(`[RSA] AES key encryption failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // =============================================
    // Decryption
    // =============================================

    /**
     * Decrypt AES key with RSA private key
     * @param {ArrayBuffer} encryptedKey - Encrypted AES key
     * @param {CryptoKey} rsaPrivateKey - RSA private key
     * @returns {Promise<CryptoKey>} Decrypted AES key
     */
    async function decryptAESKey(encryptedKey, rsaPrivateKey) {
        try {
            const rawAESKey = await window.crypto.subtle.decrypt(
                { name: 'RSA-OAEP' },
                rsaPrivateKey,
                encryptedKey
            );

            // Import the raw key back as CryptoKey
            const aesKey = await window.crypto.subtle.importKey(
                'raw',
                rawAESKey,
                AES_ALGORITHM,
                true,
                ['encrypt', 'decrypt']
            );

            Storage.addLogEntry('[RSA] AES key decrypted with RSA private key', 'success');
            return aesKey;
        } catch (error) {
            Storage.addLogEntry(`[RSA] AES key decryption failed: ${error.message}`, 'error');
            throw new Error('Failed to decrypt AES key. Wrong private key or corrupted data.');
        }
    }

    /**
     * Decrypt file data with AES-GCM
     * @param {ArrayBuffer} ciphertext - Encrypted file data
     * @param {Uint8Array} iv - Initialization vector
     * @param {CryptoKey} aesKey - AES-GCM key
     * @returns {Promise<ArrayBuffer>} Decrypted file data
     */
    async function decryptFile(ciphertext, iv, aesKey) {
        try {
            Storage.addLogEntry(`[AES] Decrypting ${Utils.formatFileSize(ciphertext.byteLength)} of data...`, 'info');

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                ciphertext
            );

            Storage.addLogEntry(`[AES] File decrypted successfully. Original: ${Utils.formatFileSize(decrypted.byteLength)}`, 'success');
            return decrypted;
        } catch (error) {
            Storage.addLogEntry(`[AES] Decryption failed: ${error.message}`, 'error');
            throw new Error('Decryption failed. Data may be corrupted or wrong key used.');
        }
    }

    // =============================================
    // Package Creation & Parsing
    // =============================================

    /**
     * Create encrypted package as downloadable Blob
     * Contains: metadata, encrypted AES key, IV, and ciphertext
     * @param {Object} params - Package parameters
     * @returns {Blob} Encrypted package as JSON blob
     */
    function createEncryptedPackage({ metadata, encryptedAESKey, iv, ciphertext }) {
        const packageData = {
            format: 'encrypter-id-v1',
            timestamp: Utils.getTimestamp(),
            metadata: {
                originalFilename: metadata.name,
                originalSize: metadata.size,
                originalType: metadata.type,
                sender: metadata.sender || 'Alice',
                receiver: metadata.receiver || 'Bob',
                encryptedFilename: `${Utils.randomHex(8)}.enc`
            },
            encryptedAESKey: Utils.arrayBufferToBase64(encryptedAESKey),
            iv: Utils.arrayBufferToBase64(iv.buffer || iv),
            ciphertext: Utils.arrayBufferToBase64(ciphertext)
        };

        const json = JSON.stringify(packageData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        Storage.addLogEntry(`[PKG] Created encrypted package: ${Utils.formatFileSize(blob.size)}`, 'success');
        return blob;
    }

    /**
     * Parse encrypted package from JSON blob/string
     * @param {string|Blob} data - Package data (JSON string or Blob)
     * @returns {Promise<Object>} Parsed package { metadata, encryptedAESKey, iv, ciphertext }
     */
    async function parseEncryptedPackage(data) {
        try {
            let jsonStr;
            if (data instanceof Blob) {
                jsonStr = await data.text();
            } else {
                jsonStr = data;
            }

            const packageData = JSON.parse(jsonStr);

            // Validate format
            if (packageData.format !== 'encrypter-id-v1') {
                throw new Error('Invalid package format. Expected encrypter-id-v1.');
            }

            const result = {
                metadata: packageData.metadata,
                encryptedAESKey: Utils.base64ToArrayBuffer(packageData.encryptedAESKey),
                iv: new Uint8Array(Utils.base64ToArrayBuffer(packageData.iv)),
                ciphertext: Utils.base64ToArrayBuffer(packageData.ciphertext),
                timestamp: packageData.timestamp
            };

            Storage.addLogEntry(`[PKG] Parsed encrypted package: ${packageData.metadata.originalFilename}`, 'success');
            return result;
        } catch (error) {
            Storage.addLogEntry(`[PKG] Failed to parse package: ${error.message}`, 'error');
            throw error;
        }
    }

    // =============================================
    // Full Encrypt/Decrypt Flows
    // =============================================

    /**
     * Full encryption flow:
     * 1. Generate AES key
     * 2. Encrypt file with AES-GCM
     * 3. Encrypt AES key with RSA public key
     * 4. Create package
     * @param {File} file - File to encrypt
     * @param {CryptoKey} rsaPublicKey - RSA public key
     * @param {CryptoKey} aesKey - Pre-generated AES key (optional)
     * @returns {Promise<Object>} Encryption result
     */
    async function fullEncrypt(file, rsaPublicKey, aesKey = null) {
        Storage.addLogEntry('═══ Starting Full Encryption Flow ═══', 'system');

        // Step 1: Generate AES key if not provided
        if (!aesKey) {
            aesKey = await generateAESKey();
        }

        // Step 2: Read file data
        Storage.addLogEntry(`[FILE] Reading ${file.name} (${Utils.formatFileSize(file.size)})...`, 'info');
        const fileData = await file.arrayBuffer();

        // Step 3: Encrypt file with AES-GCM
        const { ciphertext, iv } = await encryptFile(fileData, aesKey);

        // Step 4: Encrypt AES key with RSA public key
        const encryptedAESKey = await encryptAESKey(aesKey, rsaPublicKey);

        // Step 5: Create encrypted package
        const metadata = { name: file.name, size: file.size, type: file.type };
        const packageBlob = createEncryptedPackage({
            metadata,
            encryptedAESKey,
            iv,
            ciphertext
        });

        Storage.addLogEntry('═══ Encryption Complete ═══', 'system');

        return {
            aesKey,
            encryptedAESKey,
            iv,
            ciphertext,
            packageBlob,
            metadata
        };
    }

    /**
     * Full decryption flow:
     * 1. Parse encrypted package
     * 2. Decrypt AES key with RSA private key
     * 3. Decrypt file with AES-GCM
     * @param {Blob|string} packageData - Encrypted package
     * @param {CryptoKey} rsaPrivateKey - RSA private key
     * @returns {Promise<Object>} Decrypted result
     */
    async function fullDecrypt(packageData, rsaPrivateKey) {
        Storage.addLogEntry('═══ Starting Full Decryption Flow ═══', 'system');

        // Step 1: Parse package
        const pkg = await parseEncryptedPackage(packageData);

        // Step 2: Decrypt AES key
        const aesKey = await decryptAESKey(pkg.encryptedAESKey, rsaPrivateKey);

        // Step 3: Decrypt file
        const decryptedData = await decryptFile(pkg.ciphertext, pkg.iv, aesKey);

        Storage.addLogEntry('═══ Decryption Complete ═══', 'system');

        return {
            data: decryptedData,
            metadata: pkg.metadata,
            filename: pkg.metadata.originalFilename,
            type: pkg.metadata.originalType,
            originalSize: pkg.metadata.originalSize
        };
    }

    // Public API
    return {
        generateRSAKeyPair,
        generateAESKey,
        exportPublicKey,
        exportPrivateKey,
        importPublicKey,
        importPrivateKey,
        exportAESKey,
        importAESKey,
        encryptFile,
        encryptAESKey,
        decryptAESKey,
        decryptFile,
        createEncryptedPackage,
        parseEncryptedPackage,
        fullEncrypt,
        fullDecrypt,
        // Constants for reference
        RSA_KEY_LENGTH,
        AES_KEY_LENGTH
    };
})();
