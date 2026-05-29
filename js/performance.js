const PerfLab = (() => {
    'use strict';

    // =============================================
    // Benchmark Engine
    // =============================================

    /**
     * Run a complete benchmark for a given file size
     * @param {number} fileSize - File size in bytes
     * @param {Function} progressCallback - Called with progress updates
     * @returns {Promise<Object>} Benchmark results
     */
    async function runBenchmark(fileSize, progressCallback = null) {
        const results = {
            fileSize: fileSize,
            fileSizeFormatted: Utils.formatFileSize(fileSize),
            encryptTime: 0,
            decryptTime: 0,
            encryptTimeFormatted: '',
            decryptTimeFormatted: '',
            estRAM: 'N/A',
            cpuScore: 0,
            timestamp: Utils.getTimestamp()
        };

        try {
            // Step 1: Generate test file
            if (progressCallback) progressCallback('Generating test file...', 10);
            UI.addLog(`[BENCH] Generating ${Utils.formatFileSize(fileSize)} test file...`, 'info');
            const testFile = Utils.generateTestFile(fileSize, `benchmark_${fileSize}.bin`);

            // Step 2: Generate keys
            if (progressCallback) progressCallback('Generating keys...', 20);
            const rsaKeyPair = await Crypto.generateRSAKeyPair();
            const aesKey = await Crypto.generateAESKey();

            // Step 3: Read file data
            if (progressCallback) progressCallback('Reading file data...', 30);
            const fileData = await testFile.arrayBuffer();

            // Step 4: Measure memory before encryption (Chrome only)
            let memBefore = null;
            if (performance.memory) {
                memBefore = performance.memory.usedJSHeapSize;
            }

            // Step 5: Benchmark encryption
            if (progressCallback) progressCallback('Running encryption benchmark...', 40);
            UI.addLog(`[BENCH] Starting encryption benchmark...`, 'info');

            const encStartTime = performance.now();
            const { ciphertext, iv } = await Crypto.encryptFile(fileData, aesKey);
            const encryptedAESKey = await Crypto.encryptAESKey(aesKey, rsaKeyPair.publicKey);
            const encEndTime = performance.now();

            results.encryptTime = encEndTime - encStartTime;
            results.encryptTimeFormatted = Utils.formatDuration(results.encryptTime);

            UI.addLog(`[BENCH] Encryption completed: ${results.encryptTimeFormatted}`, 'success');

            // Step 6: Measure memory after encryption
            if (performance.memory) {
                const memAfter = performance.memory.usedJSHeapSize;
                const memUsed = memAfter - (memBefore || 0);
                results.estRAM = Utils.formatFileSize(Math.abs(memUsed));
            } else {
                // Estimate based on file size (input + output buffers)
                const estimated = fileSize * 2.5; // rough estimate: original + ciphertext + overhead
                results.estRAM = `~${Utils.formatFileSize(estimated)} (est.)`;
            }

            // Step 7: Benchmark decryption
            if (progressCallback) progressCallback('Running decryption benchmark...', 70);
            UI.addLog(`[BENCH] Starting decryption benchmark...`, 'info');

            const decStartTime = performance.now();
            const decryptedAESKey = await Crypto.decryptAESKey(encryptedAESKey, rsaKeyPair.privateKey);
            await Crypto.decryptFile(ciphertext, iv, decryptedAESKey);
            const decEndTime = performance.now();

            results.decryptTime = decEndTime - decStartTime;
            results.decryptTimeFormatted = Utils.formatDuration(results.decryptTime);

            UI.addLog(`[BENCH] Decryption completed: ${results.decryptTimeFormatted}`, 'success');

            // Step 8: CPU benchmark
            if (progressCallback) progressCallback('Running CPU benchmark...', 85);
            results.cpuScore = await runCPUBenchmark();

            if (progressCallback) progressCallback('Benchmark complete!', 100);
            UI.addLog(`[BENCH] CPU Score: ${results.cpuScore}`, 'success');
            UI.addLog(`[BENCH] ═══ Benchmark Complete ═══`, 'system');

            // Store results
            Storage.addBenchmarkResult(results);

            return results;

        } catch (error) {
            UI.addLog(`[BENCH] Benchmark failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Run a simple CPU benchmark (iterative hashing simulation)
     * Measures how many iterations the CPU can do in a fixed time
     * @returns {Promise<number>} CPU score (higher = better)
     */
    async function runCPUBenchmark() {
        return new Promise((resolve) => {
            const iterations = 100000;
            const start = performance.now();

            let hash = 0;
            for (let i = 0; i < iterations; i++) {
                // Simple computation to stress CPU
                hash = ((hash << 5) - hash + i) | 0;
                hash = Math.sin(hash) * 10000;
                hash = hash - Math.floor(hash);
            }

            const elapsed = performance.now() - start;

            // Score = iterations per millisecond (higher = faster CPU)
            const score = Math.round((iterations / elapsed) * 100);
            resolve(score);
        });
    }

    /**
     * Run benchmarks for multiple file sizes
     * @param {number[]} sizes - Array of file sizes in bytes
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Object[]>} Array of benchmark results
     */
    async function runMultipleBenchmarks(sizes, progressCallback = null) {
        const results = [];

        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const overallProgress = (i / sizes.length) * 100;

            if (progressCallback) {
                progressCallback(
                    `Benchmarking ${Utils.formatFileSize(size)}... (${i + 1}/${sizes.length})`,
                    overallProgress
                );
            }

            try {
                const result = await runBenchmark(size, (msg, pct) => {
                    if (progressCallback) {
                        const adjustedPct = overallProgress + (pct / sizes.length);
                        progressCallback(msg, adjustedPct);
                    }
                });
                results.push(result);
            } catch (error) {
                UI.addLog(`[BENCH] Skipping ${Utils.formatFileSize(size)}: ${error.message}`, 'warning');
            }

            // Small delay between benchmarks for GC
            await Utils.sleep(200);
        }

        return results;
    }

    // =============================================
    // Canvas Chart Rendering
    // =============================================

    /**
     * Render a bar chart on a canvas element
     * @param {string} canvasId - Canvas element ID
     * @param {Object[]} data - Chart data [{ label, encryptTime, decryptTime }]
     */
    function renderChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size (high-DPI aware)
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width || 600;
        const height = 350;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#6B8F71';
            ctx.font = '14px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No benchmark data. Run a benchmark to see results.', width / 2, height / 2);
            return;
        }

        // Chart dimensions
        const padding = { top: 40, right: 30, bottom: 80, left: 80 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Find max value for scale
        const maxTime = Math.max(...data.map(d => Math.max(d.encryptTime, d.decryptTime))) * 1.2;
        if (maxTime === 0) return;

        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineWidth = 1;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxTime - (maxTime / gridLines) * i;
            ctx.fillStyle = '#6B8F71';
            ctx.font = '11px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Utils.formatDuration(value), padding.left - 10, y + 4);
        }

        // Draw bars
        const barGroupWidth = chartW / data.length;
        const barWidth = Math.min(barGroupWidth * 0.3, 40);
        const gap = barWidth * 0.3;

        data.forEach((item, i) => {
            const groupX = padding.left + barGroupWidth * i + barGroupWidth / 2;

            // Encrypt bar (green gradient)
            const encHeight = (item.encryptTime / maxTime) * chartH;
            const encX = groupX - barWidth - gap / 2;
            const encY = padding.top + chartH - encHeight;

            const encGrad = ctx.createLinearGradient(encX, encY + encHeight, encX, encY);
            encGrad.addColorStop(0, '#00C853');
            encGrad.addColorStop(1, '#00FF88');
            ctx.fillStyle = encGrad;
            roundRect(ctx, encX, encY, barWidth, encHeight, 4);
            ctx.fill();

            // Glow effect for encrypt bar
            ctx.shadowColor = 'rgba(0, 255, 136, 0.3)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Decrypt bar (lime gradient)
            const decHeight = (item.decryptTime / maxTime) * chartH;
            const decX = groupX + gap / 2;
            const decY = padding.top + chartH - decHeight;

            const decGrad = ctx.createLinearGradient(decX, decY + decHeight, decX, decY);
            decGrad.addColorStop(0, '#7ACC00');
            decGrad.addColorStop(1, '#A7FF3C');
            ctx.fillStyle = decGrad;
            roundRect(ctx, decX, decY, barWidth, decHeight, 4);
            ctx.fill();

            ctx.shadowColor = 'rgba(167, 255, 60, 0.3)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Value labels on top of bars
            ctx.fillStyle = '#F5FFF9';
            ctx.font = '10px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            if (encHeight > 20) {
                ctx.fillText(Utils.formatDuration(item.encryptTime), encX + barWidth / 2, encY - 6);
            }
            if (decHeight > 20) {
                ctx.fillText(Utils.formatDuration(item.decryptTime), decX + barWidth / 2, decY - 6);
            }

            // X-axis label
            ctx.fillStyle = '#A0C4AA';
            ctx.font = '12px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.fileSizeFormatted || Utils.formatFileSize(item.fileSize), groupX, padding.top + chartH + 25);
        });

        // Draw axes
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.lineTo(width - padding.right, padding.top + chartH);
        ctx.stroke();

        // Title
        ctx.fillStyle = '#F5FFF9';
        ctx.font = 'bold 14px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Encryption vs Decryption Time', width / 2, 20);

        // Y-axis label
        ctx.save();
        ctx.translate(15, padding.top + chartH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#6B8F71';
        ctx.font = '12px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Time', 0, 0);
        ctx.restore();

        // Legend
        const legendX = width - padding.right - 180;
        const legendY = padding.top + chartH + 50;

        // Encrypt legend
        ctx.fillStyle = '#00FF88';
        ctx.fillRect(legendX, legendY - 8, 12, 12);
        ctx.fillStyle = '#A0C4AA';
        ctx.font = '12px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Encrypt Time', legendX + 18, legendY + 2);

        // Decrypt legend
        ctx.fillStyle = '#A7FF3C';
        ctx.fillRect(legendX + 110, legendY - 8, 12, 12);
        ctx.fillStyle = '#A0C4AA';
        ctx.fillText('Decrypt Time', legendX + 128, legendY + 2);
    }

    /**
     * Draw a rounded rectangle path
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} r - Corner radius
     */
    function roundRect(ctx, x, y, w, h, r) {
        if (h <= 0) { h = 1; y = y + h - 1; }
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // =============================================
    // Results Table
    // =============================================

    /**
     * Render benchmark results into an HTML table
     * @param {string} containerId - Container element ID
     * @param {Object[]} results - Benchmark results array
     */
    function renderResultsTable(containerId, results) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!results || results.length === 0) {
            container.innerHTML = '<p class="empty-state">No benchmark results yet. Generate test files and run benchmarks.</p>';
            return;
        }

        let html = `
            <table class="bench-table">
                <thead>
                    <tr>
                        <th>File Size</th>
                        <th>Encrypt Time</th>
                        <th>Decrypt Time</th>
                        <th>Est. RAM</th>
                        <th>CPU Score</th>
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(r => {
            html += `
                <tr>
                    <td><span class="badge">${r.fileSizeFormatted || Utils.formatFileSize(r.fileSize)}</span></td>
                    <td class="text-accent">${r.encryptTimeFormatted || Utils.formatDuration(r.encryptTime)}</td>
                    <td class="text-lime">${r.decryptTimeFormatted || Utils.formatDuration(r.decryptTime)}</td>
                    <td>${r.estRAM}</td>
                    <td>${r.cpuScore}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // Public API
    return {
        runBenchmark,
        runMultipleBenchmarks,
        runCPUBenchmark,
        renderChart,
        renderResultsTable
    };
})();
