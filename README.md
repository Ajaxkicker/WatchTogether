# WatchTogether

**Watch anything, together.** A browser-based watch party app with real-time screen sharing, voice chat, and text chat.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + Socket.io
- **WebRTC**: simple-peer (screen sharing + voice chat)
- **Hosting**: Vercel (frontend) + Render.com (backend)

## Features

- 🖥️ **Screen Sharing** — Host shares any screen/tab/window via WebRTC
- 🎤 **Voice Chat** — All participants can talk in real-time
- 💬 **Text Chat** — Sidebar chat with system messages
- 👥 **Room System** — 6-character room codes for easy sharing
- 🌙 **Dark Theme** — Premium dark UI with purple accents

## Local Development

### Prerequisites
- Node.js v18+
- npm

### Setup

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deployment

### Backend (Render.com)
1. Push to GitHub
2. Create a new **Web Service** on Render.com
3. Set **Root Directory** to `server`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variable: `CLIENT_URL` = your Vercel URL

### Frontend (Vercel)
1. Import the GitHub repo on Vercel
2. Set **Root Directory** to `client`
3. Set **Framework Preset** to Vite
4. Add environment variable: `VITE_SERVER_URL` = your Render URL

## Known Limitations

- **DRM Content**: Netflix, Disney+, and other DRM-protected content may show a black screen
- **Server Sleep**: Render.com free tier sleeps after 15 min of inactivity (first load may take ~30s)
- **Guest Limit**: Recommended max 6 participants (host uploads one stream copy per guest)
- **No Persistence**: Rooms only exist while someone is connected — no database needed

## License

MIT
