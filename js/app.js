const App = (() => {
    'use strict';

    // =============================================
    // SPA Router
    // =============================================

    const pages = ['landing', 'encrypt', 'transfer', 'decrypt', 'performance', 'security', 'docs'];

    /**
     * Navigate to a page by hash
     * @param {string} page - Page name (without #)
     */
    function navigateTo(page) {
        if (!pages.includes(page)) page = 'landing';
        window.location.hash = page;
    }

    /**
     * Handle hash change - show the correct page section
     */
    function handleRoute() {
        const hash = (window.location.hash || '#landing').replace('#', '');
        const page = pages.includes(hash) ? hash : 'landing';

        // Hide all pages
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('page-active');
            section.style.display = 'none';
        });

        // Show target page
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.style.display = 'block';
            // Trigger entrance animation
            requestAnimationFrame(() => {
                target.classList.add('page-active');
            });
        }

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Update mobile bottom nav
        document.querySelectorAll('.bottom-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Page-specific initialization
        onPageEnter(page);

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('sidebar-open');
    }

    /**
     * Called when a page becomes active
     * @param {string} page - Page name
     */
    function onPageEnter(page) {
        switch (page) {
            case 'encrypt':
                UI.refreshTerminal('encrypt-log');
                break;
            case 'decrypt':
                UI.refreshTerminal('decrypt-log');
                break;
            case 'performance':
                const results = Storage.getBenchmarkResults();
                PerfLab.renderResultsTable('bench-results-table', results);
                PerfLab.renderChart('bench-chart', results);
                break;
            case 'transfer':
                updateTransferUI();
                break;
        }
    }

    // =============================================
    // Initialization
    // =============================================

    /**
     * Initialize the application
     */
    function init() {
        // Check Web Crypto API support
        if (!Utils.isWebCryptoSupported()) {
            document.getElementById('app-content').innerHTML = `
                <div class="error-screen">
                    <div class="error-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF4444" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                        </svg>
                    </div>
                    <h2>Browser Not Supported</h2>
                    <p>Your browser does not support the Web Crypto API required for this application.</p>
                    <p>Please use a modern browser like Chrome, Firefox, Edge, or Safari.</p>
                </div>
            `;
            return;
        }

        // Setup navigation
        setupNavigation();

        // Setup page-specific handlers
        setupEncryptPage();
        setupDecryptPage();
        setupTransferPage();
        setupPerformancePage();
        setupSecurityPage();

        // Handle initial route
        window.addEventListener('hashchange', handleRoute);
        handleRoute();

        // Log startup
        Storage.addLogEntry('Encrypter.ID initialized successfully', 'system');
        Storage.addLogEntry(`Browser: ${navigator.userAgent.split(' ').pop()}`, 'info');
        Storage.addLogEntry('Web Crypto API: Available', 'success');
        Storage.addLogEntry('All processes run locally in your browser', 'info');

        UI.showToast('Encrypter.ID ready', 'success', 3000);
    }

    /**
     * Setup sidebar and navigation event listeners
     */
    function setupNavigation() {
        // Sidebar nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                navigateTo(page);
            });
        });

        // Bottom nav links (mobile)
        document.querySelectorAll('.bottom-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                navigateTo(page);
            });
        });

        // Hamburger menu toggle
        const hamburger = document.getElementById('hamburger-btn');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.toggle('sidebar-open');
            });
        }

        // Close sidebar on overlay click
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                document.getElementById('sidebar').classList.remove('sidebar-open');
            });
        }

        // CTA buttons on landing page
        const startBtn = document.getElementById('cta-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => navigateTo('encrypt'));
        }
        const perfBtn = document.getElementById('cta-perf');
        if (perfBtn) {
            perfBtn.addEventListener('click', () => navigateTo('performance'));
        }
    }

    // =============================================
    // ENCRYPT PAGE
    // =============================================

    function setupEncryptPage() {
        // Drag & Drop
        UI.initDragDrop('encrypt-drop-zone', handleFileSelected);

        // Generate RSA Key Pair
        const rsaBtn = document.getElementById('btn-gen-rsa');
        if (rsaBtn) {
            rsaBtn.addEventListener('click', async () => {
                try {
                    rsaBtn.disabled = true;
                    rsaBtn.textContent = 'Generating...';
                    UI.addLog('[RSA] Generating 2048-bit key pair...', 'info', 'encrypt-log');

                    const keyPair = await Crypto.generateRSAKeyPair();
                    Storage.set('rsaKeyPair', keyPair);

                    // Export keys
                    const pubPEM = await Crypto.exportPublicKey(keyPair.publicKey);
                    const privPEM = await Crypto.exportPrivateKey(keyPair.privateKey);
                    Storage.set('rsaPublicKeyPEM', pubPEM);
                    Storage.set('rsaPrivateKeyPEM', privPEM);

                    UI.updateStatus('rsa-status', true, 'RSA-2048 Key Pair Generated');
                    UI.addLog('[RSA] Key pair generated and exported', 'success', 'encrypt-log');
                    UI.showToast('RSA key pair generated successfully', 'success');

                    // Show export buttons
                    document.getElementById('key-export-section').style.display = 'block';

                    updateEncryptButton();
                } catch (err) {
                    UI.addLog(`[RSA] Error: ${err.message}`, 'error', 'encrypt-log');
                    UI.showToast('Failed to generate RSA keys', 'error');
                } finally {
                    rsaBtn.disabled = false;
                    rsaBtn.textContent = 'Generate RSA Key Pair';
                }
            });
        }

        // Generate AES Key
        const aesBtn = document.getElementById('btn-gen-aes');
        if (aesBtn) {
            aesBtn.addEventListener('click', async () => {
                try {
                    aesBtn.disabled = true;
                    UI.addLog('[AES] Generating 256-bit key...', 'info', 'encrypt-log');

                    const aesKey = await Crypto.generateAESKey();
                    Storage.set('aesKey', aesKey);

                    const aesBase64 = await Crypto.exportAESKey(aesKey);
                    Storage.set('aesKeyBase64', aesBase64);

                    UI.updateStatus('aes-status', true, 'AES-256 Key Generated');
                    UI.addLog('[AES] Key generated', 'success', 'encrypt-log');
                    UI.showToast('AES key generated', 'success');

                    updateEncryptButton();
                } catch (err) {
                    UI.addLog(`[AES] Error: ${err.message}`, 'error', 'encrypt-log');
                    UI.showToast('Failed to generate AES key', 'error');
                } finally {
                    aesBtn.disabled = false;
                }
            });
        }

        // Encrypt File
        const encryptBtn = document.getElementById('btn-encrypt');
        if (encryptBtn) {
            encryptBtn.addEventListener('click', handleEncrypt);
        }

        // Download encrypted package
        const dlBtn = document.getElementById('btn-download-package');
        if (dlBtn) {
            dlBtn.addEventListener('click', () => {
                const pkg = Storage.get('encryptedPackage');
                if (pkg) {
                    const filename = Storage.get('currentFile.name') || 'file';
                    UI.downloadFile(pkg, `${filename}.enc.json`, 'application/json');
                    UI.addLog(`[DL] Downloaded encrypted package`, 'success', 'encrypt-log');
                    UI.showToast('Encrypted package downloaded', 'success');
                }
            });
        }

        // Export public key
        const exportPubBtn = document.getElementById('btn-export-pub');
        if (exportPubBtn) {
            exportPubBtn.addEventListener('click', () => {
                const pem = Storage.get('rsaPublicKeyPEM');
                if (pem) {
                    UI.downloadFile(new Blob([pem], { type: 'text/plain' }), 'public_key.pem');
                    UI.showToast('Public key exported', 'success');
                }
            });
        }

        // Export private key
        const exportPrivBtn = document.getElementById('btn-export-priv');
        if (exportPrivBtn) {
            exportPrivBtn.addEventListener('click', () => {
                const pem = Storage.get('rsaPrivateKeyPEM');
                if (pem) {
                    UI.downloadFile(new Blob([pem], { type: 'text/plain' }), 'private_key.pem');
                    UI.showToast('Private key exported - Keep this secure!', 'warning');
                }
            });
        }

        // Copy keys
        const copyPubBtn = document.getElementById('btn-copy-pub');
        if (copyPubBtn) {
            copyPubBtn.addEventListener('click', () => {
                const pem = Storage.get('rsaPublicKeyPEM');
                if (pem) UI.copyToClipboard(pem);
            });
        }
        const copyPrivBtn = document.getElementById('btn-copy-priv');
        if (copyPrivBtn) {
            copyPrivBtn.addEventListener('click', () => {
                const pem = Storage.get('rsaPrivateKeyPEM');
                if (pem) UI.copyToClipboard(pem);
            });
        }
    }

    /**
     * Handle file selection (from drag-drop or file input)
     * @param {File} file
     */
    function handleFileSelected(file) {
        Storage.set('currentFile', {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            file: file  // Keep reference for later reading
        });

        UI.showFileInfo('encrypt-file-info', file);
        UI.addLog(`[FILE] Selected: ${file.name} (${Utils.formatFileSize(file.size)})`, 'info', 'encrypt-log');
        UI.showToast(`File loaded: ${Utils.truncateFilename(file.name, 25)}`, 'info');

        updateEncryptButton();
    }

    /**
     * Update encrypt button state based on current requirements
     */
    function updateEncryptButton() {
        const btn = document.getElementById('btn-encrypt');
        if (!btn) return;
        const hasFile = !!Storage.get('currentFile');
        const hasRSA = !!Storage.get('rsaKeyPair');
        const hasAES = !!Storage.get('aesKey');
        btn.disabled = !(hasFile && hasRSA && hasAES);
    }

    /**
     * Handle the full encryption process
     */
    async function handleEncrypt() {
        const btn = document.getElementById('btn-encrypt');
        const fileData = Storage.get('currentFile');
        const rsaKeyPair = Storage.get('rsaKeyPair');
        const aesKey = Storage.get('aesKey');

        if (!fileData || !rsaKeyPair || !aesKey) {
            UI.showToast('Please upload a file and generate keys first', 'warning');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> Encrypting...';

            UI.addLog('═══ Starting Encryption ═══', 'system', 'encrypt-log');

            // Read file
            const file = fileData.file;
            const arrayBuffer = await file.arrayBuffer();

            // Encrypt file with AES
            const { ciphertext, iv } = await Crypto.encryptFile(arrayBuffer, aesKey);
            UI.addLog(`[AES] Ciphertext size: ${Utils.formatFileSize(ciphertext.byteLength)}`, 'info', 'encrypt-log');

            // Encrypt AES key with RSA public key
            const encryptedAESKey = await Crypto.encryptAESKey(aesKey, rsaKeyPair.publicKey);
            UI.addLog(`[RSA] Encrypted AES key size: ${encryptedAESKey.byteLength} bytes`, 'info', 'encrypt-log');

            // Create encrypted package
            const metadata = { name: file.name, size: file.size, type: file.type };
            const packageBlob = Crypto.createEncryptedPackage({
                metadata,
                encryptedAESKey,
                iv,
                ciphertext
            });

            // Store results
            Storage.set('encryptionResult', {
                encryptedAESKey,
                iv,
                ciphertext,
                metadata
            });
            Storage.set('encryptedPackage', packageBlob);

            // Update UI
            updateEncryptionResults(encryptedAESKey, iv, ciphertext, packageBlob);

            UI.addLog('═══ Encryption Complete ═══', 'system', 'encrypt-log');
            UI.showToast('File encrypted successfully!', 'success');

            // Show download button
            document.getElementById('encrypt-result-section').style.display = 'block';

        } catch (err) {
            UI.addLog(`[ERROR] Encryption failed: ${err.message}`, 'error', 'encrypt-log');
            UI.showToast('Encryption failed: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Encrypt File';
            updateEncryptButton();
        }
    }

    /**
     * Update the encryption results panel
     */
    function updateEncryptionResults(encryptedAESKey, iv, ciphertext, packageBlob) {
        const container = document.getElementById('encryption-details');
        if (!container) return;

        container.innerHTML = `
            <div class="result-grid">
                <div class="result-item">
                    <span class="result-label">Encrypted AES Key</span>
                    <code class="result-value">${Utils.arrayBufferToBase64(encryptedAESKey).substring(0, 40)}...</code>
                </div>
                <div class="result-item">
                    <span class="result-label">IV / Nonce</span>
                    <code class="result-value">${Utils.arrayBufferToBase64(iv.buffer || iv)}</code>
                </div>
                <div class="result-item">
                    <span class="result-label">Ciphertext Size</span>
                    <code class="result-value">${Utils.formatFileSize(ciphertext.byteLength)}</code>
                </div>
                <div class="result-item">
                    <span class="result-label">Package Size</span>
                    <code class="result-value">${Utils.formatFileSize(packageBlob.size)}</code>
                </div>
            </div>
        `;
    }

    // =============================================
    // DECRYPT PAGE
    // =============================================

    function setupDecryptPage() {
        // Drag & Drop for encrypted package
        UI.initDragDrop('decrypt-drop-zone', handleEncryptedFileSelected);

        // Import private key from textarea
        const validateBtn = document.getElementById('btn-validate-key');
        if (validateBtn) {
            validateBtn.addEventListener('click', handleValidateKey);
        }

        // Import private key from file
        const importKeyFile = document.getElementById('import-key-file');
        if (importKeyFile) {
            importKeyFile.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const text = await file.text();
                    document.getElementById('private-key-input').value = text;
                    UI.addLog(`[KEY] Loaded key file: ${file.name}`, 'info', 'decrypt-log');
                    handleValidateKey();
                }
            });
        }

        // Decrypt button
        const decryptBtn = document.getElementById('btn-decrypt');
        if (decryptBtn) {
            decryptBtn.addEventListener('click', handleDecrypt);
        }

        // Download decrypted file
        const dlDecBtn = document.getElementById('btn-download-decrypted');
        if (dlDecBtn) {
            dlDecBtn.addEventListener('click', () => {
                const result = Storage.get('decryptedFile');
                if (result) {
                    UI.downloadFile(result.data, result.name, result.type);
                    UI.addLog(`[DL] Downloaded: ${result.name}`, 'success', 'decrypt-log');
                    UI.showToast('Decrypted file downloaded', 'success');
                }
            });
        }
    }

    function handleEncryptedFileSelected(file) {
        Storage.set('uploadedEncryptedFile', file);
        UI.showFileInfo('decrypt-file-info', file);
        UI.addLog(`[FILE] Loaded encrypted package: ${file.name}`, 'info', 'decrypt-log');
        updateDecryptButton();
    }

    async function handleValidateKey() {
        const textarea = document.getElementById('private-key-input');
        const pem = textarea.value.trim();

        if (!pem) {
            UI.showToast('Please paste or import a private key', 'warning');
            return;
        }

        try {
            UI.addLog('[KEY] Validating private key...', 'info', 'decrypt-log');
            const privateKey = await Crypto.importPrivateKey(pem);
            Storage.set('importedPrivateKey', privateKey);
            UI.updateStatus('privkey-status', true, 'Private Key Valid ✓');
            UI.addLog('[KEY] Private key validated successfully', 'success', 'decrypt-log');
            UI.showToast('Private key is valid', 'success');
            updateDecryptButton();
        } catch (err) {
            Storage.set('importedPrivateKey', null);
            UI.updateStatus('privkey-status', false, 'Invalid Key �-');
            UI.addLog(`[KEY] Validation failed: ${err.message}`, 'error', 'decrypt-log');
            UI.showToast('Invalid private key: ' + err.message, 'error');
        }
    }

    function updateDecryptButton() {
        const btn = document.getElementById('btn-decrypt');
        if (!btn) return;
        const hasFile = !!Storage.get('uploadedEncryptedFile');
        const hasKey = !!Storage.get('importedPrivateKey');
        btn.disabled = !(hasFile && hasKey);
    }

    async function handleDecrypt() {
        const btn = document.getElementById('btn-decrypt');
        const encFile = Storage.get('uploadedEncryptedFile');
        const privateKey = Storage.get('importedPrivateKey');

        if (!encFile || !privateKey) {
            UI.showToast('Upload encrypted package and import private key first', 'warning');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> Decrypting...';

            UI.addLog('═══ Starting Decryption ═══', 'system', 'decrypt-log');

            const result = await Crypto.fullDecrypt(encFile, privateKey);

            Storage.set('decryptedFile', {
                data: result.data,
                name: result.filename,
                type: result.type
            });

            // Show results
            document.getElementById('decrypt-result-section').style.display = 'block';
            const details = document.getElementById('decryption-details');
            if (details) {
                details.innerHTML = `
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="result-label">Original Filename</span>
                            <code class="result-value">${UI.escapeHtml(result.filename)}</code>
                        </div>
                        <div class="result-item">
                            <span class="result-label">File Type</span>
                            <code class="result-value">${result.type || 'Unknown'}</code>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Decrypted Size</span>
                            <code class="result-value">${Utils.formatFileSize(result.data.byteLength)}</code>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Integrity</span>
                            <code class="result-value text-accent">✓ GCM Auth Tag Verified</code>
                        </div>
                    </div>
                `;
            }

            UI.addLog('═══ Decryption Complete ═══', 'system', 'decrypt-log');
            UI.showToast('File decrypted successfully!', 'success');

        } catch (err) {
            UI.addLog(`[ERROR] Decryption failed: ${err.message}`, 'error', 'decrypt-log');
            UI.showToast('Decryption failed: ' + err.message, 'error');
            document.getElementById('decrypt-result-section').style.display = 'none';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><line x1="12" y1="11" x2="12" y2="7"/></svg> Decrypt File';
            updateDecryptButton();
        }
    }

    // =============================================
    // TRANSFER SIMULATION PAGE
    // =============================================

    function setupTransferPage() {
        const startBtn = document.getElementById('btn-start-transfer');
        if (startBtn) {
            startBtn.addEventListener('click', runTransferSimulation);
        }
    }

    async function runTransferSimulation() {
        const btn = document.getElementById('btn-start-transfer');
        const encResult = Storage.get('encryptionResult');
        const currentFile = Storage.get('currentFile');

        // Use current encrypted data or generate demo
        const metadata = encResult ? {
            sender: 'Alice',
            receiver: 'Bob',
            originalFilename: currentFile?.name || 'document.pdf',
            encryptedFilename: `${Utils.randomHex(8)}.enc`,
            timestamp: Utils.getTimestamp(),
            fileSize: currentFile ? Utils.formatFileSize(currentFile.size) : '2.4 MB'
        } : {
            sender: 'Alice',
            receiver: 'Bob',
            originalFilename: 'confidential_report.pdf',
            encryptedFilename: `${Utils.randomHex(8)}.enc`,
            timestamp: Utils.getTimestamp(),
            fileSize: '2.4 MB'
        };

        // Update metadata display
        const metaContainer = document.getElementById('transfer-metadata');
        if (metaContainer) {
            metaContainer.innerHTML = `
                <div class="meta-row"><span class="meta-label">Sender</span><span class="meta-value">${metadata.sender}</span></div>
                <div class="meta-row"><span class="meta-label">Receiver</span><span class="meta-value">${metadata.receiver}</span></div>
                <div class="meta-row"><span class="meta-label">Original File</span><span class="meta-value">${UI.escapeHtml(metadata.originalFilename)}</span></div>
                <div class="meta-row"><span class="meta-label">Encrypted File</span><span class="meta-value">${metadata.encryptedFilename}</span></div>
                <div class="meta-row"><span class="meta-label">Timestamp</span><span class="meta-value">${metadata.timestamp}</span></div>
                <div class="meta-row"><span class="meta-label">File Size</span><span class="meta-value">${metadata.fileSize}</span></div>
            `;
        }

        btn.disabled = true;

        // Simulate transfer steps
        const steps = [
            { status: 'preparing', label: 'Preparing...', progress: 15, duration: 800 },
            { status: 'encrypting', label: 'Encrypting...', progress: 40, duration: 1200 },
            { status: 'sending', label: 'Sending...', progress: 75, duration: 1500 },
            { status: 'received', label: 'Received ✓', progress: 100, duration: 600 }
        ];

        for (const step of steps) {
            updateTransferStep(step.status, step.label);
            UI.updateProgress('transfer-progress', step.progress, step.label);

            // Animate progress bar smoothly
            const progressFill = document.querySelector('#transfer-progress .progress-fill');
            if (progressFill) {
                progressFill.style.transition = `width ${step.duration}ms ease-out`;
            }

            await Utils.sleep(step.duration);
        }

        // Final state
        UI.showToast('Transfer simulation complete!', 'success');
        btn.disabled = false;
    }

    function updateTransferStep(activeStep) {
        const steps = ['preparing', 'encrypting', 'sending', 'received'];
        steps.forEach(step => {
            const el = document.getElementById(`step-${step}`);
            if (el) {
                el.classList.remove('step-active', 'step-done');
                const idx = steps.indexOf(step);
                const activeIdx = steps.indexOf(activeStep);
                if (idx < activeIdx) el.classList.add('step-done');
                else if (idx === activeIdx) el.classList.add('step-active');
            }
        });

        // Animate transfer line
        const line = document.getElementById('transfer-line');
        if (line) {
            const progress = (steps.indexOf(activeStep) + 1) / steps.length * 100;
            line.style.setProperty('--transfer-progress', `${progress}%`);
        }
    }

    function updateTransferUI() {
        // Reset transfer UI when entering the page
        UI.updateProgress('transfer-progress', 0, 'Ready');
    }

    // =============================================
    // PERFORMANCE LAB PAGE
    // =============================================

    function setupPerformancePage() {
        // Run selected benchmarks button
        const runSelectedBtn = document.getElementById('btn-run-selected-bench');
        if (runSelectedBtn) {
            runSelectedBtn.addEventListener('click', async () => {
                try {
                    // Get checked checkboxes
                    const checkboxes = document.querySelectorAll('.size-chip-input:checked');
                    if (checkboxes.length === 0) {
                        UI.showToast('Pilih setidaknya satu ukuran file untuk diuji!', 'error');
                        return;
                    }

                    const selectedSizes = Array.from(checkboxes).map(cb => parseInt(cb.value) * 1024 * 1024);

                    runSelectedBtn.disabled = true;
                    runSelectedBtn.classList.add('btn-loading');
                    
                    // Always clear previous results before running a new batch
                    Storage.clearBenchmarkResults();

                    await PerfLab.runMultipleBenchmarks(selectedSizes, (msg, pct) => {
                        UI.updateProgress('bench-progress', pct, msg);
                    });

                    const results = Storage.getBenchmarkResults();
                    PerfLab.renderResultsTable('bench-results-table', results);
                    PerfLab.renderChart('bench-chart', results);

                    UI.showToast('Benchmark complete!', 'success');
                } catch (err) {
                    UI.showToast(`Benchmark error: ${err.message}`, 'error');
                } finally {
                    runSelectedBtn.disabled = false;
                    runSelectedBtn.classList.remove('btn-loading');
                    UI.updateProgress('bench-progress', 0, 'Ready');
                }
            });
        }

        // Clear results
        const clearBtn = document.getElementById('btn-clear-bench');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                Storage.clearBenchmarkResults();
                PerfLab.renderResultsTable('bench-results-table', []);
                PerfLab.renderChart('bench-chart', []);
                UI.showToast('Results cleared', 'info');
            });
        }
    }

    // =============================================
    // SECURITY DEMO PAGE
    // =============================================

    function setupSecurityPage() {
        const startBF = document.getElementById('btn-start-bruteforce');
        const stopBF = document.getElementById('btn-stop-bruteforce');
        const bitsSelect = document.getElementById('bf-bits-select');

        if (startBF) {
            startBF.addEventListener('click', () => {
                const bits = parseInt(bitsSelect?.value || '8');
                startBruteForceDemo(bits);
            });
        }

        if (stopBF) {
            stopBF.addEventListener('click', () => {
                Storage.set('bruteForceState.running', false);
                stopBF.style.display = 'none';
                startBF.style.display = '';
            });
        }
    }

    /**
     * Run a brute force demo on a dummy key (8-bit or 12-bit only)
     * This is PURELY educational - demonstrates why larger keys are secure
     * @param {number} bits - Key size in bits (8 or 12)
     */
    async function startBruteForceDemo(bits) {
        // Safety: only allow small dummy keys
        if (bits > 16) {
            UI.showToast('Demo limited to 16-bit keys for safety', 'warning');
            bits = 16;
        }

        const totalKeys = Math.pow(2, bits);
        const targetKey = Math.floor(Math.random() * totalKeys);

        Storage.set('bruteForceState', {
            running: true,
            keyBits: bits,
            attempts: 0,
            found: false,
            targetKey: targetKey,
            elapsedTime: 0
        });

        // UI updates
        const counterEl = document.getElementById('bf-counter');
        const timeEl = document.getElementById('bf-time');
        const statusEl = document.getElementById('bf-status');
        const progressEl = document.getElementById('bf-progress-fill');
        const startBtn = document.getElementById('btn-start-bruteforce');
        const stopBtn = document.getElementById('btn-stop-bruteforce');

        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = '';

        const startTime = performance.now();
        let attempts = 0;
        let found = false;

        const batchSize = bits <= 8 ? 1 : 50; // Slower for 8-bit so user can see
        const delay = bits <= 8 ? 20 : 1; // Visual delay for small keys

        while (attempts < totalKeys && !found && Storage.get('bruteForceState.running')) {
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

            // Yield to browser
            await Utils.sleep(delay);
        }

        const totalTime = performance.now() - startTime;

        if (found) {
            if (counterEl) counterEl.textContent = attempts.toLocaleString();
            if (timeEl) timeEl.textContent = Utils.formatDuration(totalTime);
            if (statusEl) {
                statusEl.textContent = `KEY FOUND! Key: ${targetKey} (attempt #${attempts.toLocaleString()})`;
                statusEl.classList.add('bf-found');
            }
            if (progressEl) progressEl.style.width = '100%';
            UI.showToast(`Key found in ${Utils.formatDuration(totalTime)}!`, 'success');
        } else if (!Storage.get('bruteForceState.running')) {
            if (statusEl) statusEl.textContent = 'Stopped by user';
        }

        // Update comparison
        updateBruteForceComparison(bits, totalTime, attempts);

        Storage.set('bruteForceState.running', false);
        if (startBtn) startBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
    }

    /**
     * Update the brute force comparison panel
     */
    function updateBruteForceComparison(bits, timeTaken, attempts) {
        const container = document.getElementById('bf-comparison');
        if (!container) return;

        const timePerAttempt = timeTaken / attempts; // ms per attempt

        // Extrapolate for larger key sizes
        const aes128Keys = Math.pow(2, 128);
        const aes256Keys = Math.pow(2, 256);

        // Time in years for AES-128
        const aes128TimeMs = aes128Keys * timePerAttempt;
        const aes128Years = aes128TimeMs / (1000 * 60 * 60 * 24 * 365.25);

        container.innerHTML = `
            <div class="comparison-card">
                <h4>${bits}-bit Key (Demo)</h4>
                <p class="comparison-value">${Math.pow(2, bits).toLocaleString()} possible keys</p>
                <p class="comparison-time">Cracked in ${Utils.formatDuration(timeTaken)}</p>
            </div>
            <div class="comparison-card">
                <h4>AES 128-bit</h4>
                <p class="comparison-value">3.4 �- 10³⁸ possible keys</p>
                <p class="comparison-time">≈ ${aes128Years.toExponential(1)} years</p>
                <p class="comparison-note">Longer than the age of the universe</p>
            </div>
            <div class="comparison-card">
                <h4>AES 256-bit</h4>
                <p class="comparison-value">1.1 �- 10⁷⁷ possible keys</p>
                <p class="comparison-time">Practically impossible</p>
                <p class="comparison-note">Even with all computers on Earth</p>
            </div>
            <div class="comparison-card">
                <h4>RSA 2048-bit</h4>
                <p class="comparison-value">~2²⁰⁴⁸ combinations</p>
                <p class="comparison-time">Computationally infeasible</p>
                <p class="comparison-note">Factoring large primes is NP-hard</p>
            </div>
        `;
    }

    // Public API
    return {
        init,
        navigateTo
    };
})();

// =============================================
// Bootstrap - Start the application on DOM ready
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
