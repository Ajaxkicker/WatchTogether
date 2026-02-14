# 🎬 WatchTogether

**Watch anything, together.** A real-time, browser-based watch party app that lets you share your screen with friends — complete with voice chat and text chat.

> No downloads. No accounts. Just create a room, share the code, and start watching.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖥️ **Screen Sharing** | Host shares any screen, window, or browser tab in real-time via WebRTC |
| 🎤 **Voice Chat** | Talk with everyone in the room — mute/unmute with one click |
| 💬 **Text Chat** | Built-in chat sidebar with message history and join/leave notifications |
| � **Instant Rooms** | 6-character room codes — no sign-up required |
| 📱 **Responsive** | Works on desktop and mobile (guests can watch on any device) |
| 🌙 **Dark Theme** | Premium dark UI with smooth animations |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** — Fast development and builds
- **TailwindCSS v3** — Utility-first styling
- **simple-peer** — WebRTC peer connections
- **Socket.io Client** — Real-time communication
- **lucide-react** — Beautiful icons
- **react-hot-toast** — Toast notifications

### Backend
- **Node.js** + **Express** — REST API and HTTP server
- **Socket.io** — WebSocket event handling
- **uuid** — Unique message IDs
- In-memory room state (no database needed)

### Infrastructure
- **Frontend Hosting**: [Vercel](https://vercel.com) (free)
- **Backend Hosting**: [Render.com](https://render.com) (free)
- **STUN/TURN**: Google STUN + OpenRelay TURN servers (free)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Local Development

**1. Clone the repo:**
```bash
git clone https://github.com/Ajaxkicker/WatchTogether.git
cd WatchTogether
```

**2. Start the backend:**
```bash
cd server
npm install
npm run dev
```

**3. Start the frontend** (in a new terminal):
```bash
cd client
npm install
npm run dev
```

**4. Open the app:**
Navigate to `http://localhost:5173` in your browser.

---

## 🧪 Testing Locally

To test screen sharing on your own machine:

1. Open `http://localhost:5173` in **Chrome**
2. Open the same URL in a **Chrome Incognito window** (Ctrl+Shift+N)
3. Create a room in one window, join it in the other
4. Click **Share Screen** as the host — the guest window will show the stream

---

## 📦 Deployment

### Backend → Render.com
1. Create a new **Web Service** on [Render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variable: `CLIENT_URL` = your Vercel URL

### Frontend → Vercel
1. Import the repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. Set **Framework Preset** to `Vite`
4. Add environment variable: `VITE_SERVER_URL` = your Render URL

---

## ⚠️ Known Limitations

- **DRM Content** — Netflix, Disney+, and other DRM-protected services may show a black screen when shared. This is a browser-level restriction, not a bug.
- **Server Sleep** — Render.com's free tier puts the server to sleep after 15 minutes of inactivity. The first connection after sleep takes ~30 seconds.
- **Guest Limit** — Recommended max of 6 participants. The host uploads one stream copy per guest, so performance degrades with more.
- **No Persistence** — Rooms only exist in memory while at least one person is connected. No data is stored.

---

## 📐 Architecture

```
┌───────────────┐         WebSocket         ┌───────────────┐
│    Client A   │◄─────────────────────────►│  Node.js      │
│   (React +    │     Socket.io events      │  Express +    │
│    Vite)      │                           │  Socket.io    │
└───────┬───────┘                           └───────────────┘
        │                                           ▲
        │  WebRTC (peer-to-peer)                    │
        │  Screen + Audio streams                   │
        ▼                                           │
┌───────────────┐         WebSocket                 │
│    Client B   │◄──────────────────────────────────┘
│   (React +    │
│    Vite)      │
└───────────────┘
```

The server handles **signaling only** (room management, WebRTC signal relay, chat messages). The actual screen/audio streams go **directly between peers** via WebRTC.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Ajaxkicker">Ajaxkicker</a>
</p>

