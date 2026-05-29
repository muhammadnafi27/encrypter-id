const Storage = (() => {
    'use strict';

    /**
     * Application state store
     * Stores all runtime data in memory (no server, no persistent storage)
     */
    const state = {
        // Current file being processed
        currentFile: null,          // { name, size, type, data: ArrayBuffer }

        // Cryptographic keys
        rsaKeyPair: null,           // { publicKey: CryptoKey, privateKey: CryptoKey }
        aesKey: null,               // CryptoKey

        // Exported key strings (PEM format)
        rsaPublicKeyPEM: null,
        rsaPrivateKeyPEM: null,
        aesKeyBase64: null,

        // Encryption results
        encryptionResult: null,     // { ciphertext, iv, encryptedAESKey, metadata }
        encryptedPackage: null,     // Blob (JSON package)

        // Decryption state
        importedPrivateKey: null,   // CryptoKey (imported for decryption)
        decryptedFile: null,        // { name, type, data: ArrayBuffer }

        // Transfer simulation state
        transferState: {
            status: 'idle',         // idle | preparing | encrypting | sending | received
            progress: 0,
            metadata: null
        },

        // Performance benchmark results
        benchmarkResults: [],       // [{ fileSize, encryptTime, decryptTime, estRAM, cpuScore }]

        // Activity log entries
        activityLog: [],            // [{ timestamp, message, type }]

        // Security demo state
        bruteForceState: {
            running: false,
            keyBits: 8,
            attempts: 0,
            found: false,
            targetKey: null,
            elapsedTime: 0
        }
    };

    /**
     * Get a value from state
     * @param {string} key - State key (supports dot notation, e.g., 'transferState.status')
     * @returns {*} State value
     */
    function get(key) {
        const keys = key.split('.');
        let value = state;
        for (const k of keys) {
            if (value === null || value === undefined) return undefined;
            value = value[k];
        }
        return value;
    }

    /**
     * Set a value in state
     * @param {string} key - State key (supports dot notation)
     * @param {*} value - Value to set
     */
    function set(key, value) {
        const keys = key.split('.');
        let target = state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (target[keys[i]] === undefined || target[keys[i]] === null) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
    }

    /**
     * Add an entry to the activity log
     * @param {string} message - Log message
     * @param {string} type - Log type: 'info', 'success', 'error', 'warning', 'system'
     */
    function addLogEntry(message, type = 'info') {
        const entry = {
            timestamp: Utils.getTimestamp(),
            message,
            type
        };
        state.activityLog.push(entry);

        // Keep log size manageable (max 500 entries)
        if (state.activityLog.length > 500) {
            state.activityLog = state.activityLog.slice(-400);
        }
    }

    /**
     * Get all activity log entries
     * @returns {Array} Log entries
     */
    function getLog() {
        return [...state.activityLog];
    }

    /**
     * Clear the activity log
     */
    function clearLog() {
        state.activityLog = [];
    }

    /**
     * Add a benchmark result
     * @param {Object} result - Benchmark result object
     */
    function addBenchmarkResult(result) {
        state.benchmarkResults.push(result);
    }

    /**
     * Get all benchmark results
     * @returns {Array} Benchmark results
     */
    function getBenchmarkResults() {
        return [...state.benchmarkResults];
    }

    /**
     * Clear benchmark results
     */
    function clearBenchmarkResults() {
        state.benchmarkResults = [];
    }

    /**
     * Reset all encryption-related state
     */
    function resetEncryptionState() {
        state.currentFile = null;
        state.rsaKeyPair = null;
        state.aesKey = null;
        state.rsaPublicKeyPEM = null;
        state.rsaPrivateKeyPEM = null;
        state.aesKeyBase64 = null;
        state.encryptionResult = null;
        state.encryptedPackage = null;
    }

    /**
     * Reset decryption state
     */
    function resetDecryptionState() {
        state.importedPrivateKey = null;
        state.decryptedFile = null;
    }

    /**
     * Reset transfer simulation state
     */
    function resetTransferState() {
        state.transferState = {
            status: 'idle',
            progress: 0,
            metadata: null
        };
    }

    /**
     * Reset brute force demo state
     */
    function resetBruteForceState() {
        state.bruteForceState = {
            running: false,
            keyBits: 8,
            attempts: 0,
            found: false,
            targetKey: null,
            elapsedTime: 0
        };
    }

    /**
     * Get full state snapshot (for debugging)
     * @returns {Object} Copy of current state (without ArrayBuffer data)
     */
    function getStateSnapshot() {
        return {
            hasFile: !!state.currentFile,
            fileName: state.currentFile?.name || null,
            fileSize: state.currentFile?.size || 0,
            hasRSAKeys: !!state.rsaKeyPair,
            hasAESKey: !!state.aesKey,
            hasEncryptionResult: !!state.encryptionResult,
            hasEncryptedPackage: !!state.encryptedPackage,
            hasImportedPrivateKey: !!state.importedPrivateKey,
            hasDecryptedFile: !!state.decryptedFile,
            transferStatus: state.transferState.status,
            benchmarkCount: state.benchmarkResults.length,
            logCount: state.activityLog.length
        };
    }

    // Public API
    return {
        get,
        set,
        addLogEntry,
        getLog,
        clearLog,
        addBenchmarkResult,
        getBenchmarkResults,
        clearBenchmarkResults,
        resetEncryptionState,
        resetDecryptionState,
        resetTransferState,
        resetBruteForceState,
        getStateSnapshot
    };
})();
