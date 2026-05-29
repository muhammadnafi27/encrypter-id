const UI = (() => {
    'use strict';

    let toastContainer = null;

    /**
     * Initialize toast container (called once on app start)
     */
    function initToast() {
        if (toastContainer) return;
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success' | 'error' | 'info' | 'warning'
     * @param {number} duration - Auto-dismiss time in ms (default 4000)
     */
    function showToast(message, type = 'info', duration = 4000) {
        initToast();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
            error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
            info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
            warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>`
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Auto-dismiss
        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // =============================================
    // Terminal Activity Log
    // =============================================

    /**
     * Add a log entry to the terminal display
     * @param {string} message - Log message
     * @param {string} type - 'info' | 'success' | 'error' | 'warning' | 'system'
     * @param {string} terminalId - ID of terminal element (default: 'activity-log')
     */
    function addLog(message, type = 'info', terminalId = 'activity-log') {
        // Store in memory
        Storage.addLogEntry(message, type);

        // Update UI if terminal is visible
        const terminal = document.getElementById(terminalId);
        if (!terminal) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;

        const timestamp = Utils.getTimestamp().split(' ')[1]; // Just the time part
        const prefix = {
            info: '  INFO',
            success: '    OK',
            error: ' ERROR',
            warning: '  WARN',
            system: '   SYS'
        };

        entry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-prefix">${prefix[type] || '  LOG'}</span> ${escapeHtml(message)}`;

        terminal.appendChild(entry);

        // Auto-scroll to bottom
        terminal.scrollTop = terminal.scrollHeight;

        // Limit visible entries (performance)
        while (terminal.children.length > 200) {
            terminal.removeChild(terminal.firstChild);
        }
    }

    /**
     * Clear the terminal display
     * @param {string} terminalId - ID of terminal element
     */
    function clearTerminal(terminalId = 'activity-log') {
        const terminal = document.getElementById(terminalId);
        if (terminal) {
            terminal.innerHTML = '';
        }
        Storage.clearLog();
    }

    /**
     * Refresh terminal with all stored log entries
     * @param {string} terminalId - ID of terminal element
     */
    function refreshTerminal(terminalId = 'activity-log') {
        const terminal = document.getElementById(terminalId);
        if (!terminal) return;

        terminal.innerHTML = '';
        const entries = Storage.getLog();

        entries.forEach(entry => {
            const el = document.createElement('div');
            el.className = `log-entry log-${entry.type}`;
            const time = entry.timestamp.split(' ')[1];
            const prefix = {
                info: '  INFO', success: '    OK', error: ' ERROR',
                warning: '  WARN', system: '   SYS'
            };
            el.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-prefix">${prefix[entry.type] || '  LOG'}</span> ${escapeHtml(entry.message)}`;
            terminal.appendChild(el);
        });

        terminal.scrollTop = terminal.scrollHeight;
    }

    // =============================================
    // Drag & Drop File Upload
    // =============================================

    /**
     * Initialize drag and drop on a zone element
     * @param {string} zoneId - ID of the drop zone element
     * @param {Function} onFileDrop - Callback when file is dropped: (file: File) => void
     * @param {Object} options - Options { accept, maxSize }
     */
    function initDragDrop(zoneId, onFileDrop, options = {}) {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        const { accept = '*', maxSize = 200 * 1024 * 1024 } = options; // Default 200MB max

        // Prevent default browser drag behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            zone.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight on drag enter/over
        ['dragenter', 'dragover'].forEach(event => {
            zone.addEventListener(event, () => {
                zone.classList.add('drop-zone-active');
            });
        });

        // Remove highlight on drag leave/drop
        ['dragleave', 'drop'].forEach(event => {
            zone.addEventListener(event, () => {
                zone.classList.remove('drop-zone-active');
            });
        });

        // Handle file drop
        zone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length === 0) return;

            const file = files[0]; // Take first file only

            // Check file size
            if (file.size > maxSize) {
                showToast(`File too large. Maximum size: ${Utils.formatFileSize(maxSize)}`, 'error');
                return;
            }

            onFileDrop(file);
        });

        // Also handle click-to-browse
        const fileInput = zone.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file.size > maxSize) {
                        showToast(`File too large. Maximum size: ${Utils.formatFileSize(maxSize)}`, 'error');
                        return;
                    }
                    onFileDrop(file);
                    e.target.value = ''; // Reset for re-upload
                }
            });
        }
    }

    // =============================================
    // Progress Bar
    // =============================================

    /**
     * Update a progress bar
     * @param {string} barId - ID of the progress bar container
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} statusText - Status label text
     */
    function updateProgress(barId, percent, statusText = '') {
        const container = document.getElementById(barId);
        if (!container) return;

        const fill = container.querySelector('.progress-fill');
        const label = container.querySelector('.progress-label');
        const percentEl = container.querySelector('.progress-percent');

        if (fill) {
            fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        if (label) {
            label.textContent = statusText;
        }
        if (percentEl) {
            percentEl.textContent = `${Math.round(percent)}%`;
        }
    }

    // =============================================
    // Loading Spinner
    // =============================================

    /**
     * Show a loading spinner inside a container
     * @param {string} containerId - ID of the container element
     * @param {string} message - Loading message
     */
    function showSpinner(containerId, message = 'Processing...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Check if spinner already exists
        let spinner = container.querySelector('.spinner-overlay');
        if (spinner) {
            spinner.querySelector('.spinner-text').textContent = message;
            return;
        }

        spinner = document.createElement('div');
        spinner.className = 'spinner-overlay';
        spinner.innerHTML = `
            <div class="spinner-ring"></div>
            <span class="spinner-text">${escapeHtml(message)}</span>
        `;
        container.appendChild(spinner);
    }

    /**
     * Hide the loading spinner
     * @param {string} containerId - ID of the container element
     */
    function hideSpinner(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const spinner = container.querySelector('.spinner-overlay');
        if (spinner) spinner.remove();
    }

    // =============================================
    // Number Animation (Counter)
    // =============================================

    /**
     * Animate a number from start to end
     * @param {HTMLElement|string} element - Element or element ID
     * @param {number} from - Start value
     * @param {number} to - End value
     * @param {number} duration - Animation duration in ms
     * @param {string} suffix - Suffix text (e.g., '%', 'ms')
     */
    function animateCounter(element, from, to, duration = 1000, suffix = '') {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        const start = performance.now();
        const diff = to - from;

        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = from + diff * eased;

            el.textContent = Math.round(value).toLocaleString() + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // =============================================
    // Status Indicators
    // =============================================

    /**
     * Update a key status indicator
     * @param {string} elementId - ID of the status element
     * @param {boolean} ready - Whether the key/item is ready
     * @param {string} readyText - Text when ready
     * @param {string} notReadyText - Text when not ready
     */
    function updateStatus(elementId, ready, readyText = 'Ready', notReadyText = 'Not Generated') {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.className = `status-indicator ${ready ? 'status-ready' : 'status-pending'}`;
        el.innerHTML = `
            <span class="status-dot ${ready ? 'dot-ready' : 'dot-pending'}"></span>
            <span>${ready ? readyText : notReadyText}</span>
        `;
    }

    // =============================================
    // File Info Display
    // =============================================

    /**
     * Display file information in a target element
     * @param {string} containerId - Container element ID
     * @param {File|Object} file - File object or { name, size, type }
     */
    function showFileInfo(containerId, file) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const typeIcon = Utils.getFileTypeIcon(file.type);
        const iconSVGs = {
            image: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
            video: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
            audio: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
            pdf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M10 13l-2 2 2 2M14 13l2 2-2 2"/></svg>',
            archive: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>',
            code: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
            file: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>'
        };

        container.innerHTML = `
            <div class="file-info-card">
                <div class="file-info-icon">${iconSVGs[typeIcon] || iconSVGs.file}</div>
                <div class="file-info-details">
                    <div class="file-info-name" title="${escapeHtml(file.name)}">${escapeHtml(Utils.truncateFilename(file.name, 40))}</div>
                    <div class="file-info-meta">
                        <span>${Utils.formatFileSize(file.size)}</span>
                        <span class="meta-separator">•</span>
                        <span>${file.type || 'Unknown type'}</span>
                    </div>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }

    // =============================================
    // Download Helper
    // =============================================

    /**
     * Trigger a file download
     * @param {Blob|ArrayBuffer} data - File data
     * @param {string} filename - Download filename
     * @param {string} mimeType - MIME type
     */
    function downloadFile(data, filename, mimeType = 'application/octet-stream') {
        let blob;
        if (data instanceof Blob) {
            blob = data;
        } else {
            blob = new Blob([data], { type: mimeType });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // =============================================
    // Helpers
    // =============================================

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard', 'success', 2000);
        } catch {
            // Fallback for non-HTTPS
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Copied to clipboard', 'success', 2000);
        }
    }

    /**
     * Show/hide an element with animation
     * @param {string} elementId - Element ID
     * @param {boolean} show - Show or hide
     */
    function toggleVisibility(elementId, show) {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (show) {
            el.style.display = '';
            el.classList.add('fade-in');
            el.classList.remove('fade-out');
        } else {
            el.classList.add('fade-out');
            el.classList.remove('fade-in');
            setTimeout(() => { el.style.display = 'none'; }, 300);
        }
    }

    // Public API
    return {
        showToast,
        addLog,
        clearTerminal,
        refreshTerminal,
        initDragDrop,
        updateProgress,
        showSpinner,
        hideSpinner,
        animateCounter,
        updateStatus,
        showFileInfo,
        downloadFile,
        escapeHtml,
        copyToClipboard,
        toggleVisibility
    };
})();
