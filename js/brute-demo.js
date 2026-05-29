/**
 * =============================================================
 * Encrypter.ID - Brute Force Demo Module
 * =============================================================
 * Educational brute force simulator for DUMMY keys only.
 * Supports 8-bit to 16-bit key sizes.
 *
 * IMPORTANT: This module does NOT attack real AES, RSA,
 * passwords, user files, or any third-party system.
 * It only demonstrates why small keys are insecure.
 * =============================================================
 */

const BruteDemo = (() => {
    'use strict';

    let _running = false;
    let _animFrameId = null;

    /**
     * Start brute force demo on a dummy key
     * @param {number} bits - Key size in bits (8, 10, 12, or 16 max)
     */
    async function start(bits) {
        // Safety cap: only allow small dummy keys
        if (bits > 16) {
            UI.showToast('Demo dibatasi maksimal 16-bit untuk keamanan', 'warning');
            bits = 16;
        }

        const totalKeys = Math.pow(2, bits);
        const targetKey = Math.floor(Math.random() * totalKeys);

        _running = true;

        // UI elements
        const counterEl = document.getElementById('bf-counter');
        const timeEl = document.getElementById('bf-time');
        const statusEl = document.getElementById('bf-status');
        const progressEl = document.getElementById('bf-progress-fill');
        const startBtn = document.getElementById('btn-start-bruteforce');
        const stopBtn = document.getElementById('btn-stop-bruteforce');

        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = '';
        if (statusEl) statusEl.classList.remove('bf-found');

        UI.addLog(`[BF] Starting brute force demo: ${bits}-bit key (${totalKeys.toLocaleString()} possible keys)`, 'info', 'encrypt-log');

        const startTime = performance.now();
        let attempts = 0;
        let found = false;

        const batchSize = bits <= 8 ? 1 : (bits <= 12 ? 10 : 50);
        const delay = bits <= 8 ? 20 : (bits <= 12 ? 5 : 1);

        while (attempts < totalKeys && !found && _running) {
            for (let i = 0; i < batchSize && attempts < totalKeys; i++) {
                if (attempts === targetKey) {
                    found = true;
                    break;
                }
                attempts++;
            }

            // Update UI
            const elapsed = performance.now() - startTime;
            if (counterEl) counterEl.textContent = attempts.toLocaleString();
            if (timeEl) timeEl.textContent = Utils.formatDuration(elapsed);
            if (progressEl) progressEl.style.width = `${(attempts / totalKeys) * 100}%`;
            if (statusEl) statusEl.textContent = found ? 'KEY FOUND!' : 'Searching...';

            // Yield to browser for UI updates
            await Utils.sleep(delay);
        }

        const totalTime = performance.now() - startTime;

        if (found) {
            if (counterEl) counterEl.textContent = attempts.toLocaleString();
            if (timeEl) timeEl.textContent = Utils.formatDuration(totalTime);
            if (statusEl) {
                statusEl.textContent = `KEY FOUND! Key value: ${targetKey} (attempt #${attempts.toLocaleString()})`;
                statusEl.classList.add('bf-found');
            }
            if (progressEl) progressEl.style.width = '100%';
            UI.showToast(`Key ditemukan dalam ${Utils.formatDuration(totalTime)}!`, 'success');
            UI.addLog(`[BF] Key found: ${targetKey} after ${attempts.toLocaleString()} attempts in ${Utils.formatDuration(totalTime)}`, 'success', 'encrypt-log');
        } else if (!_running) {
            if (statusEl) statusEl.textContent = 'Dihentikan oleh user';
            UI.addLog('[BF] Demo stopped by user', 'warning', 'encrypt-log');
        }

        // Update comparison panel
        updateComparison(bits, totalTime, attempts);

        _running = false;
        if (startBtn) startBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
    }

    /**
     * Stop the running demo
     */
    function stop() {
        _running = false;
    }

    /**
     * Check if demo is currently running
     * @returns {boolean}
     */
    function isRunning() {
        return _running;
    }

    /**
     * Update comparison cards with extrapolated data
     * @param {number} bits - Tested key size
     * @param {number} timeTaken - Time in ms
     * @param {number} attempts - Number of attempts made
     */
    function updateComparison(bits, timeTaken, attempts) {
        const container = document.getElementById('bf-comparison');
        if (!container) return;

        const timePerAttempt = attempts > 0 ? timeTaken / attempts : 1;

        // Extrapolate times
        const aes128Keys = Math.pow(2, 128);
        const aes128TimeMs = aes128Keys * timePerAttempt;
        const aes128Years = aes128TimeMs / (1000 * 60 * 60 * 24 * 365.25);

        container.innerHTML = `
            <div class="comparison-card card">
                <h4>${bits}-bit Key (Demo)</h4>
                <p class="comparison-value">${Math.pow(2, bits).toLocaleString()} possible keys</p>
                <p class="comparison-time">Cracked in ${Utils.formatDuration(timeTaken)}</p>
            </div>
            <div class="comparison-card card">
                <h4>AES 128-bit</h4>
                <p class="comparison-value">3.4 x 10^38 possible keys</p>
                <p class="comparison-time">Sekitar ${aes128Years.toExponential(1)} tahun</p>
                <p class="comparison-note">Lebih lama dari usia alam semesta</p>
            </div>
            <div class="comparison-card card">
                <h4>AES 256-bit</h4>
                <p class="comparison-value">1.1 x 10^77 possible keys</p>
                <p class="comparison-time">Secara praktis mustahil</p>
                <p class="comparison-note">Bahkan dengan semua komputer di dunia</p>
            </div>
            <div class="comparison-card card">
                <h4>RSA 2048-bit</h4>
                <p class="comparison-value">~2^2048 kombinasi</p>
                <p class="comparison-time">Secara komputasi tidak feasible</p>
                <p class="comparison-note">Faktorisasi bilangan prima besar sangat sulit</p>
            </div>
        `;
    }

    // Public API
    return {
        start,
        stop,
        isRunning
    };
})();
