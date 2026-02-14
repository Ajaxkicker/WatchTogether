# WatchTogether — Master Build Prompt

> **HOW TO USE THIS FILE:**
> Paste the contents of the "PROMPT" section below directly into your AI IDE (Cursor, Windsurf, etc.)
> as a new chat message. Attach the `SPEC.md` file alongside it. The AI will build the entire project.

---

## PROMPT

You are an expert full-stack developer. I need you to build a complete, production-ready web application called **WatchTogether** — a browser-based watch party app. The full technical specification is in the attached `SPEC.md` file. Read it thoroughly before writing any code.

### Your Task

Build the **entire project** from scratch, creating every file needed for a fully working application. Do not skip any files, do not use placeholder comments like "// add logic here", and do not truncate file contents. Every file must be complete and functional.

---

### Project Overview (Summary)

WatchTogether lets a host share their screen to a group of guests in a shared "room." All participants can talk via voice chat and communicate via a text chat sidebar. The tech stack is:

- **Frontend**: React 18 + Vite + TailwindCSS + simple-peer + socket.io-client
- **Backend**: Node.js + Express + Socket.io
- **WebRTC**: Browser-native `getDisplayMedia` + `getUserMedia` + simple-peer
- **Hosting**: Vercel (frontend) + Render.com (backend) — both free

---

### Build Instructions

Follow this exact order to build the project. Complete each phase fully before moving to the next.

---

#### PHASE 1 — Project Scaffolding

Create the full directory structure as defined in SPEC.md. Initialize both `client/` and `server/` with their respective `package.json` files. Include all dependencies.

**`server/package.json`** must include:
```json
{
  "name": "watchtogether-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js", "dev": "nodemon index.js" },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "uuid": "^9.0.0"
  },
  "devDependencies": { "nodemon": "^3.0.2" }
}
```

**`client/package.json`** must include:
```json
{
  "name": "watchtogether-client",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.18.0",
    "simple-peer": "^9.11.1",
    "socket.io-client": "^4.7.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "vite": "^5.0.0"
  }
}
```

---

#### PHASE 2 — Backend Server

Build the complete backend in `server/`.

**`server/roomManager.js`**
- Export a `RoomManager` class (or a singleton object)
- Stores rooms in a `Map<roomCode, Room>`
- Room shape: `{ roomCode, hostSocketId, participants: Map<socketId, { username, muted }>, isSharing, createdAt }`
- Methods:
  - `createRoom(roomCode, hostSocketId, username)` → creates and returns room
  - `joinRoom(roomCode, socketId, username)` → adds participant, returns room or null
  - `leaveRoom(roomCode, socketId)` → removes participant, deletes room if empty, returns updated room
  - `getRoom(roomCode)` → returns room or null
  - `setMicStatus(roomCode, socketId, muted)` → updates participant mic status
  - `setSharing(roomCode, isSharing)` → updates sharing state
  - `generateRoomCode()` → returns a random 6-character uppercase alphanumeric string

**`server/index.js`**
- Create Express app + HTTP server + Socket.io server
- Configure CORS from `process.env.CLIENT_URL` (with fallback to `*` for dev)
- Mount health check route: `GET /health` → returns `{ status: 'ok' }`
- Mount `GET /create-room` → generates a room code, returns `{ roomCode }`
- Handle all Socket.io events defined in SPEC.md:
  - `join-room` → join room, emit `room-joined` to joining socket, emit `user-joined` to rest of room
  - `signal` → forward signal to target socket
  - `send-message` → broadcast `receive-message` to entire room with username + timestamp + uuid
  - `host-started-sharing` → update room state, broadcast to room
  - `host-stopped-sharing` → update room state, broadcast to room
  - `mic-status` → update state, broadcast `mic-status-update` to room
  - `disconnect` → call leaveRoom, broadcast `user-left`, emit `host-stopped-sharing` if host left
- Console log all room events for debugging
- Listen on `process.env.PORT || 3001`

---

#### PHASE 3 — Frontend Configuration Files

**`client/index.html`**
- Standard Vite HTML template
- Title: "WatchTogether"
- Load Inter font from Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

**`client/vite.config.js`**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
```

**`client/tailwind.config.js`** — Use the config from SPEC.md design system section.

**`client/postcss.config.js`**
```javascript
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

**`client/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body { background-color: #0f0f0f; color: #f5f5f5; font-family: 'Inter', system-ui, sans-serif; margin: 0; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
```

---

#### PHASE 4 — Utilities and Hooks

**`client/src/utils/webrtcConfig.js`** — Export `ICE_SERVERS` as defined in SPEC.md.

**`client/src/hooks/useSocket.js`**
- Accepts `{ roomCode, username }`
- Creates socket.io connection to `import.meta.env.VITE_SERVER_URL`
- Emits `join-room` on connect
- Manages state: `{ participants, isHost, isHostSharing, socketId }`
- Handles: `room-joined`, `user-joined`, `user-left`, `host-started-sharing`, `host-stopped-sharing`, `mic-status-update`
- Returns: `{ socket, participants, isHost, isHostSharing, socketId, connected }`
- Cleans up socket on unmount

**`client/src/hooks/useChat.js`**
- Accepts `socket`
- Manages `messages` array state
- Listens for `receive-message` events, appends to array
- Exposes `sendMessage(text)` that emits `send-message`
- Returns `{ messages, sendMessage }`

**`client/src/hooks/useWebRTC.js`**
- Accepts `{ socket, isHost, participants, isHostSharing }`
- Manages `peers` ref (Map of socketId → SimplePeer)
- Manages `remoteStream` state (the stream guests receive)
- Manages `localStream` ref (host's screen capture)

- **`startScreenShare()`**:
  1. Call `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })`
  2. Store stream in `localStream.current`
  3. For each participant socketId, create a `new SimplePeer({ initiator: false, trickle: true, config: ICE_SERVERS })`
  4. Host listens for `signal` event on peer and emits `signal` via socket with `{ to: socketId, signal }`
  5. Host listens for `stream` on peer (shouldn't get one, but handle it)
  6. Emit `host-started-sharing` via socket
  7. On stream track `ended` event, call `stopScreenShare()`

- **`stopScreenShare()`**:
  1. Stop all tracks in `localStream.current`
  2. Destroy all peers
  3. Clear peers Map
  4. Set `localStream.current = null`
  5. Emit `host-stopped-sharing`

- **Guest WebRTC flow**:
  1. When `isHostSharing` becomes true, create a `new SimplePeer({ initiator: true, trickle: true, config: ICE_SERVERS })`
  2. On `signal` event from peer, emit `signal` via socket with `{ to: hostSocketId, signal }`
  3. On `stream` event, set `remoteStream` state
  4. Listen for incoming `signal` socket events and call `peer.signal(incomingSignal)`

- **New participant joins while host is sharing**:
  1. Host receives `user-joined` while `localStream.current` exists
  2. Create a new peer for the new participant, add the stream tracks

- **`addAudioTrack(audioTrack)`**:
  1. Add track to all existing peer connections
  2. Store track reference for new connections

- Returns: `{ startScreenShare, stopScreenShare, remoteStream, isSharing: !!localStream.current }`

---

#### PHASE 5 — Components

**`client/src/components/RoomHeader.jsx`**
- Props: `{ roomCode, participantCount, isSharing, onLeave }`
- Shows: app name, room code (monospace, copyable), participant count, share link button, leave button
- Share link button copies `window.location.href` to clipboard and shows toast "Link copied!"
- If `isSharing`, show a green "● Live" badge

**`client/src/components/ScreenSharePlayer.jsx`**
- Props: `{ stream, isHostSharing, isHost }`
- If `isHost`: show "You are the host. Use the Share Screen button to begin." with a screen icon
- If `!isHostSharing && !isHost`: show animated waiting screen "Waiting for host to share their screen..."
  - Include a gentle pulsing animation on the waiting text
- If `stream`: render `<video>` element, set `srcObject` on ref when stream changes, autoplay, playsInline, controls
- Video should fill its container (aspect-ratio: 16/9, object-fit: contain, black background)

**`client/src/components/ParticipantList.jsx`**
- Props: `{ participants, currentSocketId, isHost }`
- Renders a list of participant entries
- Each entry: username, host crown icon if isHost, mic icon (muted/unmuted state)
- "You" label next to current user
- Styled as a scrollable panel

**`client/src/components/TextChat.jsx`**
- Props: `{ messages, onSendMessage, currentUsername }`
- Scrollable message list (auto-scroll to bottom on new messages, unless user scrolled up)
- Message input at bottom (textarea that submits on Enter, newline on Shift+Enter)
- Own messages: right-aligned, purple background
- Others' messages: left-aligned, dark surface background
- System messages (type: 'system'): centered, muted color, italic
- Each message shows username + relative time ("just now", "2m ago")
- Character counter when nearing 500 char limit

**`client/src/components/VoiceControls.jsx`**
- Props: `{ isMuted, onToggleMute, hasPermission, onRequestPermission }`
- If `!hasPermission`: shows "Enable Mic" button
- If `hasPermission`: shows mic toggle button (Mic / MicOff icon from lucide-react)
- Active mic: green ring animation when unmuted

**`client/src/components/LoadingOverlay.jsx`**
- Props: `{ message }`
- Full-screen dark overlay with spinner and message text
- Used while connecting to socket

---

#### PHASE 6 — Pages

**`client/src/pages/Home.jsx`**
- Fetches `GET /create-room` when "Create Room" is clicked, navigates to `/room/:roomCode`
- Shows a username input (required before creating or joining)
- Saves username to `sessionStorage` as `wt_username`
- Join form: input for room code + button; validates non-empty, normalizes to uppercase
- On join, navigates to `/room/:roomCode`
- Full-page dark background, centered card layout, clean modern design
- Animate in on load with a subtle fade

**`client/src/pages/Room.jsx`**
- Reads `roomCode` from URL params
- Reads username from `sessionStorage`; if missing, redirect to home
- Initializes `useSocket`, `useWebRTC`, `useChat` hooks
- Manages local mic state: `isMuted`, `hasMicPermission`
- Mic toggle: calls `track.enabled = !isMuted` on local audio track; emits `mic-status`
- Request mic: calls `getUserMedia({ audio: true })`, stores track, adds to peers
- Renders the full room layout (see SPEC.md layout section)
- Controls bar contains: VoiceControls + (if isHost) Share Screen / Stop Sharing button
- Show `LoadingOverlay` while socket is connecting
- On leave: stop tracks, navigate to home

---

#### PHASE 7 — App Entry Point

**`client/src/App.jsx`**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Room from './pages/Room'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#f5f5f5', border: '1px solid #2e2e2e' } }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**`client/src/main.jsx`**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

---

#### PHASE 8 — Environment Files

**`client/.env`**
```
VITE_SERVER_URL=http://localhost:3001
```

**`client/.env.production`**
```
VITE_SERVER_URL=https://YOUR_RENDER_URL_HERE
```

**`server/.env`**
```
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

#### PHASE 9 — Supporting Files

**`.gitignore`** (root level)
```
node_modules/
.env
.env.local
dist/
.DS_Store
```

**`README.md`**
Include:
- Project description
- Tech stack
- Local development setup (step-by-step)
- Deployment guide (Render + Vercel)
- Known limitations (DRM, guest limit, server sleep)

---

### Critical Implementation Rules

1. **No placeholder code.** Every function must be fully implemented. Do not write `// TODO` or `// implement later`.

2. **simple-peer in Vite** requires a special import. Use:
   ```javascript
   import SimplePeer from 'simple-peer/simplepeer.min.js'
   ```
   Or add to `vite.config.js`:
   ```javascript
   resolve: { alias: { 'simple-peer': 'simple-peer/simplepeer.min.js' } }
   ```

3. **WebRTC signaling order matters.** Guests initiate (send offer), host responds (sends answer). Do not reverse this.

4. **Peer cleanup.** Always call `peer.destroy()` and remove from the peers Map when a participant leaves or on unmount. Memory leaks cause crashes in long sessions.

5. **Video element srcObject.** Must be set via a `useEffect` watching the stream, not as a React prop. Example:
   ```javascript
   const videoRef = useRef()
   useEffect(() => {
     if (videoRef.current && stream) videoRef.current.srcObject = stream
   }, [stream])
   ```

6. **Socket event cleanup.** In every `useEffect` that registers socket event listeners, return a cleanup function that calls `socket.off(eventName)`.

7. **CORS.** The server must allow the frontend origin in both Express CORS config and Socket.io CORS config.

8. **Mic permission UX.** Never auto-request microphone on page load. Only request when the user explicitly clicks "Enable Mic".

9. **Toast notifications.** Use `react-hot-toast` for all user-facing feedback (errors, success messages, join/leave notifications).

10. **Tailwind dark theme.** All components use the dark color palette from SPEC.md. No white backgrounds anywhere.

---

### After Building

Once all files are created, provide:
1. A summary of every file created
2. Exact commands to run the project locally:
   ```bash
   # Terminal 1 — Backend
   cd server && npm install && npm run dev

   # Terminal 2 — Frontend
   cd client && npm install && npm run dev
   ```
3. Any known issues or edge cases to test
4. Deployment steps for Render.com + Vercel

---

Begin building now. Start with Phase 1 and work through each phase in order. Do not stop until all phases are complete.
