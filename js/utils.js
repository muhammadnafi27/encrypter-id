const Utils = (() => {
    'use strict';

    /**
     * Format bytes into human-readable size string
     * @param {number} bytes - File size in bytes
     * @param {number} decimals - Decimal places (default 2)
     * @returns {string} Formatted size string (e.g., "1.5 MB")
     */
    function formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    /**
     * Convert ArrayBuffer to Base64 string
     * @param {ArrayBuffer} buffer - ArrayBuffer to convert
     * @returns {string} Base64 encoded string
     */
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 string to ArrayBuffer
     * @param {string} base64 - Base64 encoded string
     * @returns {ArrayBuffer} Decoded ArrayBuffer
     */
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Convert CryptoKey to PEM-like format for export
     * @param {ArrayBuffer} exportedKey - Exported key data
     * @param {string} type - 'PUBLIC' or 'PRIVATE'
     * @returns {string} PEM formatted key string
     */
    function arrayBufferToPEM(exportedKey, type) {
        const base64 = arrayBufferToBase64(exportedKey);
        const lines = base64.match(/.{1,64}/g) || [];
        const label = type === 'PUBLIC' ? 'PUBLIC KEY' : 'PRIVATE KEY';
        return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
    }

    /**
     * Parse PEM-like string back to ArrayBuffer
     * @param {string} pem - PEM formatted key string
     * @returns {ArrayBuffer} Key data as ArrayBuffer
     */
    function pemToArrayBuffer(pem) {
        // Remove PEM headers, footers, and whitespace
        const base64 = pem
            .replace(/-----BEGIN [A-Z ]+-----/g, '')
            .replace(/-----END [A-Z ]+-----/g, '')
            .replace(/\s/g, '');
        return base64ToArrayBuffer(base64);
    }

    /**
     * Detect PEM key type from string
     * @param {string} pem - PEM formatted string
     * @returns {string|null} 'PUBLIC' or 'PRIVATE' or null
     */
    function detectPEMType(pem) {
        if (pem.includes('BEGIN PUBLIC KEY')) return 'PUBLIC';
        if (pem.includes('BEGIN PRIVATE KEY')) return 'PRIVATE';
        return null;
    }

    /**
     * Generate a formatted timestamp string
     * @returns {string} ISO-like timestamp (e.g., "2024-01-15 14:30:22")
     */
    function getTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
            `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    /**
     * Generate a random hex string (for filenames, IDs)
     * @param {number} length - Number of hex characters
     * @returns {string} Random hex string
     */
    function randomHex(length = 8) {
        const array = new Uint8Array(Math.ceil(length / 2));
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
    }

    /**
     * Truncate a filename for display, keeping extension
     * @param {string} name - Full filename
     * @param {number} maxLength - Maximum display length
     * @returns {string} Truncated filename
     */
    function truncateFilename(name, maxLength = 30) {
        if (name.length <= maxLength) return name;
        const ext = name.lastIndexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')) : '';
        const base = name.slice(0, name.lastIndexOf('.') !== -1 ? name.lastIndexOf('.') : name.length);
        const available = maxLength - ext.length - 3; // 3 for '...'
        if (available <= 0) return name.slice(0, maxLength);
        return base.slice(0, available) + '...' + ext;
    }

    /**
     * Get file type icon class based on MIME type
     * @param {string} mimeType - File MIME type
     * @returns {string} Icon identifier
     */
    function getFileTypeIcon(mimeType) {
        if (!mimeType) return 'file';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
        if (mimeType.includes('text') || mimeType.includes('javascript') || mimeType.includes('json')) return 'code';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
        return 'file';
    }

    /**
     * Format milliseconds to human-readable duration
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration (e.g., "1.23s", "456ms")
     */
    function formatDuration(ms) {
        if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
        if (ms < 1000) return `${ms.toFixed(2)} ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`;
        const mins = Math.floor(ms / 60000);
        const secs = ((ms % 60000) / 1000).toFixed(1);
        return `${mins}m ${secs}s`;
    }

    /**
     * Debounce a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, wait = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Sleep/delay helper
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Resolves after ms milliseconds
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate a random test file of specified size
     * @param {number} sizeInBytes - Desired file size
     * @param {string} filename - Filename for the blob
     * @returns {File} Generated test file
     */
    function generateTestFile(sizeInBytes, filename = 'testfile.bin') {
        const chunkSize = 1024 * 1024; // 1MB chunks
        const chunks = [];
        let remaining = sizeInBytes;

        // Create a pool of random data to copy from (fast)
        const randomPool = new Uint8Array(65536);
        crypto.getRandomValues(randomPool);

        while (remaining > 0) {
            const size = Math.min(chunkSize, remaining);
            const chunk = new Uint8Array(size);
            
            // Fast fill by copying from randomPool
            let offset = 0;
            while (offset < size) {
                const copySize = Math.min(65536, size - offset);
                chunk.set(randomPool.subarray(0, copySize), offset);
                offset += copySize;
            }
            
            chunks.push(chunk);
            remaining -= size;
        }

        return new File(chunks, filename, { type: 'application/octet-stream' });
    }

    /**
     * Check if Web Crypto API is available
     * @returns {boolean} True if Web Crypto API is supported
     */
    function isWebCryptoSupported() {
        return !!(window.crypto && window.crypto.subtle);
    }

    /**
     * Check if browser is running in secure context (HTTPS or localhost)
     * @returns {boolean} True if secure context
     */
    function isSecureContext() {
        return window.isSecureContext;
    }

    // Public API
    return {
        formatFileSize,
        arrayBufferToBase64,
        base64ToArrayBuffer,
        arrayBufferToPEM,
        pemToArrayBuffer,
        detectPEMType,
        getTimestamp,
        randomHex,
        truncateFilename,
        getFileTypeIcon,
        formatDuration,
        debounce,
        sleep,
        generateTestFile,
        isWebCryptoSupported,
        isSecureContext
    };
})();
