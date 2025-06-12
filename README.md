# 📋 Cross-Device Clipboard Sync (CDCS)

**CDCS** is a free, open-source tool that lets you sync your clipboard text from a mobile device to your desktop seamlessly. Built for simplicity and speed, CDCS is perfect for developers, writers, or anyone who constantly switches between devices.

* ✅ Open Source & Free
* 🚀 Hosted on Vercel (Frontend)
* ⚙️ Powered by [ElysiaJS](https://elysiajs.com/) (Backend)
* 🧩 Installable via `npm`

---

## 🌐 Live Version

* **Frontend:** [cdcs.vercel.app](https://cdcs.vercel.app)
* **Backend API:** [https://cdcs-backend.onrender.com](https://cdcs-backend.onrender.com)

> Don't want to use the public backend? You can self-host it with ElysiaJS (see below).

---

## ✨ Features

* 📲 Send text from your phone to your computer instantly
* 🖥️ View clipboard history in your terminal
* 📋 Automatically copy selected text via CLI (`wl-copy` supported)
* 🔐 No account required – simple and private
* 🌍 Cross-platform – works in browser + desktop terminal

---

## 🧪 Try it in 3 Steps

### 1. Install the CLI

```bash
npm install -g cdcs
```

### 2. Start Listening on Desktop

```bash
cdcs
```

### 3. Open the App on Your Phone

Go to [cdcs.vercel.app](https://cdcs.vercel.app), paste your text, and send it.

Done! Your desktop will receive the text and copy it to your clipboard automatically.

---

## ⚙️ Self-Hosting the Backend (Optional)

Clone the backend repo and deploy it anywhere (Render, Fly.io, etc.):

```bash
git clone https://github.com/Sophistiqq/cdcs-backend.git
cd cdcs-backend
bun install
bun start
```

> Make sure to update your frontend or CLI to use your custom backend URL instead of `https://cdcs-backend.onrender.com`.

---

## 📦 Technologies Used

* **Frontend:** Svelte
* **Backend:** ElysiaJS
* **Database:** MongoDB (via Elysia plugins)
* **CLI:** Node.js + NPM
* **Clipboard Tool:** `wl-copy` (Wayland) or customize for your system

---

## 🙌 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

* Frontend: [github.com/Sophistiqq/cdcs-frontend](https://github.com/Sophistiqq/cdcs-frontend)
* Backend: [github.com/Sophistiqq/cdcs-backend](https://github.com/Sophistiqq/cdcs-backend)

---

## 🛡️ License

MIT License. Free to use, modify, and share.
