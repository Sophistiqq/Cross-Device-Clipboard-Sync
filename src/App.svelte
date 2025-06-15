<script lang="ts">
import {
	ClipboardCopy,
	ClipboardPaste,
	Server,
	Wifi,
	WifiOff,
	Trash2,
	History,
	Download,
	Settings,
} from "lucide-svelte";
import { onMount } from "svelte";

// --- LOGIC FROM YOUR SCRIPT ---
let serverUrl = "";
let input = "";
let status = "";
let isConnected = false;
let isChecking = false;
let isSending = false;
let isPasting = false;
let clipboardHistory: string[] = [];
let autoCheckInterval: number;

// --- STATE FOR NEW UI ---
let currentTab: "history" | "settings" = "history";

onMount(() => {
	serverUrl = localStorage.getItem("cdcs-server") || "";
	const savedHistory = localStorage.getItem("cdcs-history");
	if (savedHistory) {
		clipboardHistory = JSON.parse(savedHistory);
	}

	if (serverUrl) {
		checkServerConnection();
		// Auto-check connection every 30 seconds
		autoCheckInterval = window.setInterval(checkServerConnection, 30000);
	}

	return () => {
		if (autoCheckInterval) clearInterval(autoCheckInterval);
	};
});

async function checkServerConnection() {
	if (!serverUrl.trim()) return;

	isChecking = true;
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const res = await fetch(`${serverUrl}/`, {
			method: "GET",
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		isConnected = res.ok;

		if (isConnected) {
			status = "🟢 Server connected";
		} else {
			status = "🔴 Server responded with error";
		}
	} catch (e: any) {
		isConnected = false;
		if (e.name === "AbortError") {
			status = "⏱ Server timeout";
		} else {
			status = "🔴 Server unreachable";
		}
	} finally {
		isChecking = false;
		setTimeout(() => (status = ""), 3000);
	}
}

function saveServer() {
	localStorage.setItem("cdcs-server", serverUrl);
	status = "💾 Server saved";
	setTimeout(() => (status = ""), 2000);

	if (serverUrl) {
		checkServerConnection();
		if (autoCheckInterval) clearInterval(autoCheckInterval);
		autoCheckInterval = window.setInterval(checkServerConnection, 30000);
	}
}

function addToHistory(text: string) {
	const trimmed = text.trim();
	if (!trimmed || clipboardHistory.includes(trimmed)) return;

	clipboardHistory = [trimmed, ...clipboardHistory.slice(0, 9)]; // Keep last 10
	localStorage.setItem("cdcs-history", JSON.stringify(clipboardHistory));
}

async function sendClipboard() {
	if (!serverUrl || !input.trim() || !isConnected) return;

	isSending = true;
	status = "📋 Sending to server...";
	try {
		const res = await fetch(`${serverUrl}/clipboard`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text: input }),
		});

		if (res.ok) {
			status = "✅ Sent successfully!";
			addToHistory(input);
			input = "";
		} else {
			status = "❌ Failed to send";
		}
	} catch (e) {
		status = "🌐 Network error";
	} finally {
		isSending = false;
		setTimeout(() => (status = ""), 3000);
	}
}

async function pasteFromClipboard() {
	isPasting = true;
	status = "📥 Pasting from clipboard...";
	try {
		const text = await navigator.clipboard.readText();
		input = text;
		status = "✅ Pasted from device clipboard";
	} catch (err) {
		status = "❌ Clipboard access denied";
	} finally {
		isPasting = false;
		setTimeout(() => (status = ""), 2000);
	}
}

function clearInput() {
	input = "";
	status = "🗑 Input cleared";
	setTimeout(() => (status = ""), 1500);
}

function useFromHistory(text: string) {
	input = text;
	status = "📝 Loaded from history";
	setTimeout(() => (status = ""), 2000);
}

function clearHistory() {
	clipboardHistory = [];
	localStorage.removeItem("cdcs-history");
	status = "🗑 History cleared";
	setTimeout(() => (status = ""), 2000);
}

function downloadAsFile() {
	if (!input.trim()) return;

	const blob = new Blob([input], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `clipboard-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
	a.click();
	URL.revokeObjectURL(url);

	status = "💾 Downloaded as file";
	setTimeout(() => (status = ""), 2000);
}

async function handleFileUpload(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file || !serverUrl || !isConnected) return;

	status = "⬆ Uploading file...";
	isSending = true; // Use isSending to disable other actions during upload
	const formData = new FormData();
	formData.append("file", file);

	try {
		const res = await fetch(`${serverUrl}/upload`, {
			method: "POST",
			body: formData,
		});

		if (res.ok) {
			status = "✅ File uploaded!";
		} else {
			status = "❌ Upload failed";
		}
	} catch (err) {
		status = "🌐 Network error during upload";
	} finally {
		isSending = false;
		setTimeout(() => (status = ""), 3000);
	}
}
</script>

<div class="app-container">
  <!-- HEADER -->
  <header class="header">
    <div class="title">
      <ClipboardCopy size={24} />
      <h1>Clipboard Share</h1>
    </div>
    <div class="connection-status">
      {#if isChecking && !isConnected}
        <div class="spinner"></div>
        <span>Checking...</span>
      {:else if isConnected}
        <Wifi size={16} class="icon-connected" />
        <span class="text-connected">Connected</span>
      {:else}
        <WifiOff size={16} class="icon-disconnected" />
        <span class="text-disconnected">Offline</span>
      {/if}
    </div>
  </header>

  <!-- MAIN LAYOUT -->
  <main class="main-layout">
    
    <!-- LEFT COLUMN: CORE ACTIONS -->
    <div class="main-column">
      <!-- 1. Server Configuration -->
      <div class="card">
        <div class="input-group">
          <Server size={20} class="input-icon" />
          <input
            type="text"
            bind:value={serverUrl}
            on:blur={saveServer}
            placeholder="http://server-ip-address:3000"
            class="server-input"
          />
          <button
            on:click={checkServerConnection}
            disabled={isChecking || !serverUrl.trim()}
            class="btn btn-secondary btn-small"
            title="Test connection"
          >
            {#if isChecking} <div class="spinner-small"></div> {:else} Check {/if}
          </button>
        </div>
      </div>

      <!-- 2. Text/File Input Area -->
      <div class="card">
        <div class="textarea-wrapper">
          <textarea
            bind:value={input}
            placeholder="Enter text to share, or paste from your clipboard..."
            rows="10"
          ></textarea>
          <div class="textarea-controls">
            <button on:click={clearInput} disabled={!input.trim()} class="btn-icon" title="Clear input">
              <Trash2 size={16} />
            </button>
            <button on:click={downloadAsFile} disabled={!input.trim()} class="btn-icon" title="Download as file">
              <Download size={16} />
            </button>
          </div>
        </div>
        
        <div class="input-actions">
          <button on:click={pasteFromClipboard} disabled={isPasting || isSending} class="btn btn-secondary">
             {#if isPasting} <div class="spinner-small"></div> {:else} <ClipboardPaste size={18} /> {/if}
            <span>Paste from Device</span>
          </button>
          <input type="file" id="fileInput" hidden on:change={handleFileUpload} />
          <button class="btn btn-secondary" on:click={() => document.getElementById('fileInput')?.click()} disabled={isSending || !isConnected}>
            <span>📤 Upload File</span>
          </button>
        </div>

        <button
          on:click={sendClipboard}
          disabled={!serverUrl.trim() || !input.trim() || !isConnected || isSending}
          class="btn btn-primary send-button"
          title="Send content to the server"
        >
          {#if isSending} <div class="spinner-small"></div> {:else} <ClipboardCopy size={18} /> {/if}
          <span>Send to Server</span>
        </button>
        
        <div class="status-bar">
          <p class="status-text">{status || 'Ready'}</p>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: SIDEBAR FOR HISTORY/SETTINGS -->
    <div class="sidebar-column">
      <div class="card">
        <!-- Tab Navigation -->
        <nav class="tab-nav">
          <button
            class:active={currentTab === 'history'}
            on:click={() => currentTab = 'history'}
          >
            <History size={16} />
            <span>History ({clipboardHistory.length})</span>
          </button>
          <button
            class:active={currentTab === 'settings'}
            on:click={() => currentTab = 'settings'}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </nav>

        <!-- Tab Content -->
        <div class="tab-content">
          {#if currentTab === 'history'}
            <div class="panel">
              <div class="panel-header">
                <h3>Recent Clips</h3>
                <button on:click={clearHistory} class="btn btn-danger btn-small" disabled={clipboardHistory.length === 0}>
                  <Trash2 size={14} /> Clear All
                </button>
              </div>
              <div class="history-list">
                {#each clipboardHistory as text (text)}
                  <div class="history-item" on:click={() => useFromHistory(text)} on:keydown={() => useFromHistory(text)} role="button" tabindex="0">
                    <p class="history-text">{text.length > 120 ? text.slice(0, 120) + '…' : text}</p>
                    <span class="history-meta">{text.length} chars</span>
                  </div>
                {:else}
                  <div class="empty-state">
                    <p>No history yet.</p>
                    <span>Sent items will appear here.</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if currentTab === 'settings'}
            <div class="panel">
               <div class="panel-header">
                <h3>Application Settings</h3>
              </div>
              <div class="settings-list">
                <div class="setting-item">
                  <strong>Auto-check connection</strong>
                  <span>Every 30 seconds</span>
                </div>
                <div class="setting-item">
                  <strong>History limit</strong>
                  <span>Keeps last 10 entries</span>
                </div>
                <div class="setting-item">
                  <strong>Connection timeout</strong>
                  <span>5 seconds</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  /* --- DESIGN SYSTEM: CSS Variables --- */
  :root {
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;

    --color-bg: #0f172a; /* slate-900 */
    --color-bg-card: #1e293b; /* slate-800 */
    --color-bg-input: #0f172a; /* slate-900 */
    --color-border: #334155; /* slate-700 */
    --color-border-focus: #3b82f6; /* blue-500 */
    
    --color-text-primary: #f1f5f9; /* slate-100 */
    --color-text-secondary: #94a3b8; /* slate-400 */
    --color-text-placeholder: #64748b; /* slate-500 */

    --color-accent: #3b82f6; /* blue-500 */
    --color-accent-hover: #2563eb; /* blue-600 */
    --color-danger: #ef4444; /* red-500 */
    --color-danger-hover: #dc2626; /* red-600 */
    
    --color-status-connected: #22c55e; /* green-500 */
    --color-status-disconnected: #f87171; /* red-400 */
    
    --radius-md: 8px;
    --radius-lg: 12px;
    
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-focus: 0 0 0 3px color-mix(in srgb, var(--color-border-focus) 25%, transparent);
  }

  /* --- GLOBAL STYLES --- */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .app-container {
    min-height: 100vh;
    background-color: var(--color-bg);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    padding: 1.5rem;
  }
  
  /* --- HEADER --- */
  .header {
    max-width: 1200px;
    margin: 0 auto 2rem auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .title h1 {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    background-color: var(--color-bg-card);
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }
  .text-connected { color: var(--color-status-connected); }
  .text-disconnected { color: var(--color-status-disconnected); }


  /* --- LAYOUT --- */
  .main-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    align-items: start;
  }
  .main-column, .sidebar-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (max-width: 900px) {
    .main-layout {
      grid-template-columns: 1fr;
    }
  }
  
  /* --- COMPONENTS --- */
  .card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
  }

  /* Server Input */
  .input-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .server-input {
    flex-grow: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: 1rem;
    font-family: var(--font-mono);
    min-width: 0;
  }
  .server-input::placeholder {
    color: var(--color-text-placeholder);
    font-family: var(--font-sans);
  }

  /* Textarea */
  .textarea-wrapper {
    position: relative;
  }
  textarea {
    width: 100%;
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    padding-right: 3.5rem;
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.6;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  textarea:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: var(--shadow-focus);
  }
  textarea::placeholder {
    color: var(--color-text-placeholder);
  }
  .textarea-controls {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.25rem;
  }

  /* Actions below textarea */
  .input-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }
  .send-button {
    margin-top: 1rem;
    width: 100%;
  }
  
  /* Status Bar */
  .status-bar {
    margin-top: 1rem;
    text-align: center;
  }
  .status-text {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    min-height: 1.25rem;
    transition: color 0.3s;
    font-weight: 500;
  }

  /* --- BUTTONS --- */
  .btn, .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-weight: 500;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s, border-color 0.2s, opacity 0.2s;
    border: 1px solid transparent;
  }
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  .btn:active:not(:disabled) {
    transform: scale(0.98);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background-color: var(--color-accent);
    color: white;
  }
  .btn-primary:hover:not(:disabled) {
    background-color: var(--color-accent-hover);
  }
  
  .btn-secondary {
    background-color: color-mix(in srgb, var(--color-border) 40%, transparent);
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }
  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-border);
  }
  
  .btn-danger {
    background-color: transparent;
    border-color: var(--color-danger);
    color: var(--color-danger);
  }
  .btn-danger:hover:not(:disabled) {
    background-color: var(--color-danger);
    color: white;
  }
  
  .btn-small {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .btn-icon {
    background-color: transparent;
    color: var(--color-text-secondary);
    padding: 0.5rem;
    border-radius: var(--radius-md);
  }
  .btn-icon:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-bg) 50%, transparent);
    color: var(--color-text-primary);
  }

  /* --- SIDEBAR: TABS, HISTORY, SETTINGS --- */
  .tab-nav {
    display: flex;
    background-color: var(--color-bg);
    border-radius: var(--radius-md);
    padding: 0.25rem;
  }
  .tab-nav button {
    flex: 1;
    padding: 0.5rem;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }
  .tab-nav button:hover:not(:disabled) {
    color: var(--color-text-primary);
  }
  .tab-nav button.active {
    background-color: var(--color-border);
    color: var(--color-text-primary);
  }

  .tab-content {
    margin-top: 1rem;
    min-height: 200px;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
  }
  .panel-header h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 40vh;
    overflow-y: auto;
  }
  .history-item {
    padding: 0.75rem;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
  }
  .history-item:hover, .history-item:focus {
    background-color: var(--color-bg);
    border-color: var(--color-border);
    outline: none;
  }
  .history-text {
    font-size: 0.9rem;
    line-height: 1.5;
    word-break: break-word;
    color: var(--color-text-secondary);
    transition: color 0.2s;
  }
  .history-item:hover .history-text, .history-item:focus .history-text {
    color: var(--color-text-primary);
  }
  .history-meta {
    font-size: 0.75rem;
    color: var(--color-text-placeholder);
    margin-top: 0.25rem;
  }
  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-secondary);
  }
  .empty-state span {
    font-size: 0.9rem;
    color: var(--color-text-placeholder);
  }
  
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .setting-item strong {
    font-weight: 500;
  }
  .setting-item span {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    background-color: var(--color-bg);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }

  /* --- UTILITIES --- */
  .spinner, .spinner-small {
    border: 2px solid var(--color-border);
    border-top-color: var(--color-text-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .spinner { width: 14px; height: 14px; }
  .spinner-small { width: 12px; height: 12px; }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
