# .gitignore

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

# .vscode/extensions.json

```json
{
  "recommendations": ["svelte.svelte-vscode"]
}

```

# index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Svelte + TS</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>

```

# package.json

```json
{
  "name": "cross-device-clipboard-sync",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.0.3",
    "@tsconfig/svelte": "^5.0.4",
    "svelte": "^5.28.1",
    "svelte-check": "^4.1.6",
    "typescript": "~5.8.3",
    "vite": "^6.3.5"
  },
  "dependencies": {
    "lucide-svelte": "^0.513.0"
  }
}

```

# public/vite.svg

This is a file of the type: SVG Image

# README.md

```md
# Svelte + TS + Vite

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

\`\`\`ts
// store.ts
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
\`\`\`

```

# src/app.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

```

# src/App.svelte

```svelte
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
    Settings
  } from "lucide-svelte";
  import { onMount } from "svelte";

  let serverUrl = "";
  let input = "";
  let status = "";
  let isConnected = false;
  let isChecking = false;
  let isSending = false;
  let isPasting = false;
  let clipboardHistory: string[] = [];
  let showHistory = false;
  let showSettings = false;
  let autoCheckInterval: number;

  onMount(() => {
    serverUrl = localStorage.getItem("cdcs-server") || "";
    const savedHistory = localStorage.getItem("cdcs-history");
    if (savedHistory) {
      clipboardHistory = JSON.parse(savedHistory);
    }
    
    if (serverUrl) {
      checkServerConnection();
      // Auto-check connection every 30 seconds
      autoCheckInterval = setInterval(checkServerConnection, 30000);
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
        method: 'GET',
        signal: controller.signal
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
      if (e.name === 'AbortError') {
        status = "⏱️ Server timeout";
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
      autoCheckInterval = setInterval(checkServerConnection, 30000);
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
    try {
      const res = await fetch(`${serverUrl}/clipboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      
      if (res.ok) {
        status = "📋 Sent successfully!";
        addToHistory(input);
        input = "";
      } else {
        status = "❌ Failed to send";
      }
    } catch (e) {
      status = "⚠️ Network error";
    } finally {
      isSending = false;
      setTimeout(() => (status = ""), 3000);
    }
  }

  async function pasteFromClipboard() {
    isPasting = true;
    try {
      const text = await navigator.clipboard.readText();
      input = text;
      status = "📥 Pasted from device clipboard";
    } catch (err) {
      status = "❌ Clipboard access denied";
    } finally {
      isPasting = false;
      setTimeout(() => (status = ""), 2000);
    }
  }

  function clearInput() {
    input = "";
    status = "🗑️ Input cleared";
    setTimeout(() => (status = ""), 1500);
  }

  function useFromHistory(text: string) {
    input = text;
    showHistory = false;
    status = "📝 Loaded from history";
    setTimeout(() => (status = ""), 2000);
  }

  function clearHistory() {
    clipboardHistory = [];
    localStorage.removeItem("cdcs-history");
    status = "🗑️ History cleared";
    setTimeout(() => (status = ""), 2000);
  }

  function downloadAsFile() {
    if (!input.trim()) return;
    
    const blob = new Blob([input], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipboard-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    status = "💾 Downloaded as file";
    setTimeout(() => (status = ""), 2000);
  }
</script>

<div class="app">
  <header class="header">
    <div class="title">
      <ClipboardCopy size={24} />
      <h1>Clipboard Share</h1>
    </div>
    <div class="connection-status">
      {#if isChecking}
        <div class="spinner"></div>
        <span>Checking...</span>
      {:else if isConnected}
        <Wifi size={16} class="connected" />
        <span class="connected">Connected</span>
      {:else}
        <WifiOff size={16} class="disconnected" />
        <span class="disconnected">Offline</span>
      {/if}
    </div>
  </header>

  <div class="container">
    <div class="server-section">
      <label class="input-group">
        <Server size={18} />
        <input
          type="text"
          bind:value={serverUrl}
          on:blur={saveServer}
          placeholder="http://192.168.x.x:3000"
          class="server-input"
        />
        <button 
          on:click={checkServerConnection} 
          disabled={isChecking || !serverUrl.trim()}
          class="check-btn"
          title="Test connection"
        >
          {#if isChecking}
            <div class="spinner-small"></div>
          {:else}
            Check
          {/if}
        </button>
      </label>
    </div>

    <div class="main-content">
      <div class="textarea-container">
        <textarea 
          bind:value={input} 
          placeholder="Enter text to share across devices..."
          rows="8"
        ></textarea>
        
        <div class="textarea-actions">
          <button 
            on:click={clearInput} 
            disabled={!input.trim()}
            class="secondary small"
            title="Clear input"
          >
            <Trash2 size={14} />
          </button>
          <button 
            on:click={downloadAsFile} 
            disabled={!input.trim()}
            class="secondary small"
            title="Download as file"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div class="button-grid">
        <button 
          on:click={pasteFromClipboard} 
          disabled={isPasting}
          class="secondary"
          title="Paste from device clipboard"
        >
          {#if isPasting}
            <div class="spinner-small"></div>
          {:else}
            <ClipboardPaste size={18} />
          {/if}
          Paste from Device
        </button>

        <button 
          on:click={sendClipboard}
          disabled={!serverUrl || !input.trim() || !isConnected || isSending}
          class="primary"
          title="Send to server"
        >
          {#if isSending}
            <div class="spinner-small"></div>
          {:else}
            <ClipboardCopy size={18} />
          {/if}
          Send to Server
        </button>
      </div>

      <div class="secondary-actions">
        <button 
          on:click={() => showHistory = !showHistory}
          class="secondary small"
          disabled={clipboardHistory.length === 0}
        >
          <History size={16} />
          History ({clipboardHistory.length})
        </button>
        
        <button 
          on:click={() => showSettings = !showSettings}
          class="secondary small"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      {#if showHistory && clipboardHistory.length > 0}
        <div class="history-panel">
          <div class="panel-header">
            <h3>Recent Clipboard History</h3>
            <button on:click={clearHistory} class="danger small">
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
          <div class="history-list">
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            {#each clipboardHistory as item}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="history-item" on:click={() => useFromHistory(item)}>
                <div class="history-text">{item.length > 100 ? item.slice(0, 100) + '...' : item}</div>
                <div class="history-meta">{item.length} chars</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if showSettings}
        <div class="settings-panel">
          <div class="panel-header">
            <h3>Settings</h3>
          </div>
          <div class="settings-list">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <div class="setting-item">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label>
                <strong>Auto-check connection:</strong>
                <span>Every 30 seconds when server URL is set</span>
              </label>
            </div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <div class="setting-item">
              <label>
                <strong>History limit:</strong>
                <span>Keeps last 10 clipboard entries</span>
              </label>
            </div>
            <div class="setting-item">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label>
                <strong>Connection timeout:</strong>
                <span>5 seconds</span>
              </label>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="status-bar">
      <div class="status-text">{status}</div>
    </div>
  </div>
</div>

<style>
  .app {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a365d 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e2e8f0;
  }

  .header {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
  }

  .title h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .connected {
    color: #4ade80;
  }

  .disconnected {
    color: #f87171;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .server-section {
    margin-bottom: 2rem;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .server-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 1rem;
    padding: 0.5rem;
    color: #e2e8f0;
  }

  .server-input::placeholder {
    color: #94a3b8;
  }

  .check-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-btn:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .check-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .main-content {
    background: rgba(30, 41, 59, 0.9);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 64px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
  }

  .textarea-container {
    position: relative;
    margin-bottom: 1.5rem;
  }

  textarea {
    width: 100%;
    min-height: 160px;
    padding: 1.25rem;
    font-size: 1rem;
    border: 2px solid #334155;
    border-radius: 12px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
    transition: border-color 0.2s;
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
  }

  textarea::placeholder {
    color: #94a3b8;
  }

  textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .textarea-actions {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.5rem;
  }

  .button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 48px;
  }

  .primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  .primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  }

  .secondary {
    background: rgba(51, 65, 85, 0.8);
    color: #e2e8f0;
    border: 1px solid #475569;
  }

  .secondary:hover:not(:disabled) {
    background: rgba(71, 85, 105, 0.9);
    transform: translateY(-1px);
  }

  .small {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    min-height: 36px;
  }

  .danger {
    background: #ef4444;
    color: white;
  }

  .danger:hover:not(:disabled) {
    background: #dc2626;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .secondary-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .history-panel, .settings-panel {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .panel-header h3 {
    margin: 0;
    color: #e2e8f0;
    font-size: 1.1rem;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-item {
    background: rgba(30, 41, 59, 0.9);
    border: 1px solid rgba(71, 85, 105, 0.6);
    border-radius: 8px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .history-item:hover {
    border-color: #3b82f6;
    background: rgba(51, 65, 85, 0.9);
    transform: translateX(4px);
  }

  .history-text {
    font-size: 0.9rem;
    line-height: 1.4;
    color: #e2e8f0;
    word-break: break-word;
  }

  .history-meta {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setting-item label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #e2e8f0;
  }

  .setting-item span {
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .status-bar {
    text-align: center;
    margin-top: 1.5rem;
  }

  .status-text {
    color: rgba(226, 232, 240, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
    min-height: 1.2rem;
  }

  .spinner, .spinner-small {
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner {
    width: 16px;
    height: 16px;
  }

  .spinner-small {
    width: 14px;
    height: 14px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .header {
      padding: 1rem;
    }
    
    .container {
      padding: 1rem;
    }
    
    .button-grid {
      grid-template-columns: 1fr;
    }
    
    .secondary-actions {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>

```

# src/assets/svelte.svg

This is a file of the type: SVG Image

# src/lib/Counter.svelte

```svelte
<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button onclick={increment}>
  count is {count}
</button>

```

# src/main.ts

```ts
import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

```

# src/vite-env.d.ts

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />

```

# svelte.config.js

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
}

```

# tsconfig.app.json

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    /**
     * Typecheck JS in `.svelte` and `.js` files by default.
     * Disable checkJs if you'd like to use dynamic types in JS.
     * Note that setting allowJs false does not prevent the use
     * of JS in `.svelte` files.
     */
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true,
    "moduleDetection": "force"
  },
  "include": ["src/**/*.ts", "src/**/*.js", "src/**/*.svelte"]
}

```

# tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

# tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}

```

# vite.config.ts

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
})

```

