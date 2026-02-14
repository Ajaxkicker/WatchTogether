# WatchTogether — Full Technical Specification

## Project Overview

WatchTogether is a browser-based watch party web application. A host can share their screen (any window, tab, or full screen) and stream it in real-time to guests who have joined the same room. All participants can communicate via voice chat and a text chat sidebar. The entire stack must be free to host and operate.

---

## Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS v3
- **Routing**: React Router v6
- **WebRTC Peer Library**: simple-peer (v9)
- **Socket Client**: socket.io-client (v4)
- **Icons**: lucide-react
- **Notifications**: react-hot-toast

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **WebSocket**: Socket.io (v4)
- **Utilities**: uuid (v9), cors

### Infrastructure (Free Tier)
- **Frontend Hosting**: Vercel (deploy from GitHub)
- **Backend Hosting**: Render.com (free Node.js web service)
- **STUN Server**: `stun:stun.l.google.com:19302` (free, public)
- **TURN Server**: OpenRelay by Metered.ca (free, 50GB/month)
  - URL: `turn:openrelay.metered.ca:80`
  - Username: `openrelayproject`
  - Credential: `openrelayproject`

---

## Repository Structure

```
watchtogether/
├── client/                         # React + Vite frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── TextChat.jsx            # Chat sidebar component
│   │   │   ├── VoiceControls.jsx       # Mic mute/unmute button + indicator
│   │   │   ├── ParticipantList.jsx     # List of users in room
│   │   │   ├── ScreenSharePlayer.jsx   # Video player for the stream
│   │   │   ├── RoomHeader.jsx          # Room code, share link, leave button
│   │   │   └── LoadingOverlay.jsx      # Waiting for host screen
│   │   ├── hooks/
│   │   │   ├── useSocket.js            # Socket.io connection + events
│   │   │   ├── useWebRTC.js            # Peer connections, screen share, voice
│   │   │   └── useChat.js              # Text chat state management
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing: create or join room
│   │   │   └── Room.jsx                # Main watch party room
│   │   ├── utils/
│   │   │   └── webrtcConfig.js         # ICE server config (STUN/TURN)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                   # Tailwind imports
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/
│   ├── index.js                        # Express + Socket.io server
│   ├── roomManager.js                  # In-memory room state
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Detailed Feature Specifications

### 1. Home Page (`/`)

**UI Elements:**
- App logo/name (WatchTogether)
- Tagline: "Watch anything, together."
- Two-section layout:
  - **Left card**: "Create a Room" — button to generate a new room
  - **Right card**: "Join a Room" — text input for room code + join button
- A username input is shown before entering any room (can be a modal or inline)

**Behavior:**
- Clicking "Create Room" generates a unique 6-character uppercase room code on the server, then navigates to `/room/:roomCode`
- Entering a room code and clicking "Join" navigates to `/room/:roomCode` as a guest
- If a user navigates directly to `/room/:roomCode`, prompt for username if not set, then join
- Username is stored in `sessionStorage` so it persists on refresh
- Room code is case-insensitive on input (normalize to uppercase)

---

### 2. Room Page (`/room/:roomCode`)

**Layout (Desktop):**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Room Code | Participant Count | Share Link | Leave  │
├──────────────────────────────────────────┬──────────────────┤
│                                          │  PARTICIPANTS    │
│          VIDEO / WAITING SCREEN          │  LIST            │
│                                          ├──────────────────┤
│                                          │  TEXT CHAT       │
│                                          │  (scrollable)    │
├──────────────────────────────────────────┤                  │
│  CONTROLS: Mic Toggle | Share Screen     │  [message input] │
└──────────────────────────────────────────┴──────────────────┘
```

**Layout (Mobile):**
- Video takes full width at top
- Controls bar below video
- Chat is collapsed by default, toggled with a button

**States:**
- **Waiting (Guest)**: "Waiting for the host to start sharing..." with a subtle animation
- **Sharing Active**: Video stream fills the video area
- **Host View**: No video player shown; instead a "You are sharing" indicator with option to stop

---

### 3. Screen Sharing

**Host Flow:**
1. Host clicks "Share Screen" button in controls
2. Browser's native screen share picker opens (`getDisplayMedia`)
3. Video + audio tracks are captured
4. A new WebRTC peer connection is created for each guest in the room
5. Tracks are added to each peer connection
6. Guests receive the stream and display it in a `<video>` element
7. Host sees a green "Sharing" badge in the header
8. "Stop Sharing" button appears; clicking it ends all streams

**Guest Flow:**
1. Guest joins room and waits
2. When host starts sharing, socket event triggers creation of peer connection
3. Peer sends an offer, host answers, ICE candidates are exchanged via socket
4. Stream appears in guest's video player automatically
5. Video has native controls enabled (play/pause, volume, fullscreen)

**Technical Notes:**
- Use `simple-peer` with `initiator: true` for guests, `initiator: false` for host
- The host creates one peer per guest
- On `peer.on('stream')`, set `videoElement.srcObject = stream`
- When host stops sharing, emit `host-stopped-sharing` socket event; guests show waiting screen

---

### 4. Voice Chat

**Behavior:**
- All participants (host + guests) can enable voice chat independently
- On joining the room, request microphone permission via `getUserMedia({ audio: true })`
- If permission granted, audio track is added to every existing peer connection
- New peers joining after voice is enabled also receive the audio track
- Mute/unmute toggles `track.enabled` (does NOT stop the track)
- Each participant's mic status (muted/unmuted) is broadcast via socket so others can see it
- A small mic icon appears next to each user in the participant list indicating their status

**UI:**
- Large mic button in controls bar (microphone icon when active, microphone-off when muted)
- Visual ring/pulse animation on the mic button when unmuted and voice is detected (optional enhancement using `AudioContext` analyser)

---

### 5. Text Chat

**Behavior:**
- Messages are sent to the server via socket event `send-message`
- Server broadcasts message to all sockets in the room
- Each message includes: `{ username, message, timestamp, id }`
- Messages are displayed in a scrollable sidebar
- Chat auto-scrolls to bottom on new messages unless user has manually scrolled up
- Pressing Enter sends a message; Shift+Enter adds a newline
- Max message length: 500 characters
- System messages (e.g., "[Alex joined]", "[Alex left]") are styled differently

**Message UI:**
- Username + timestamp header on each message
- Own messages are right-aligned with accent color background
- Others' messages are left-aligned with neutral background
- System messages are centered in muted text

---

### 6. Participant List

- Displays all connected users
- Each entry shows: username, mic status icon, host badge (if applicable)
- Updates in real-time as users join/leave
- Max display: if >8 participants, show "8 and X more"

---

## Socket.io Events Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomCode, username }` | Join or create a room |
| `signal` | `{ to, signal }` | Forward WebRTC signal to a specific peer |
| `send-message` | `{ message }` | Send a chat message |
| `host-started-sharing` | `{}` | Notify room host began screen share |
| `host-stopped-sharing` | `{}` | Notify room host stopped screen share |
| `mic-status` | `{ muted: boolean }` | Broadcast mic mute state |
| `leave-room` | `{}` | Explicit leave (also handled on disconnect) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{ roomCode, participants, isHost }` | Confirmation of room join |
| `user-joined` | `{ socketId, username }` | A new user joined |
| `user-left` | `{ socketId, username }` | A user disconnected |
| `signal` | `{ from, signal }` | Incoming WebRTC signal |
| `receive-message` | `{ username, message, timestamp, id }` | Incoming chat message |
| `host-started-sharing` | `{}` | Host began sharing |
| `host-stopped-sharing` | `{}` | Host stopped sharing |
| `mic-status-update` | `{ socketId, muted }` | Peer mic status changed |
| `error` | `{ message }` | Server-side error |

---

## Server Architecture (`server/index.js`)

```
Express App
  └── HTTP Server
        └── Socket.io Server
              └── Rooms (in-memory Map)
                    └── Room {
                          roomCode: string,
                          hostSocketId: string,
                          participants: Map<socketId, { username, muted }>,
                          isSharing: boolean,
                          createdAt: timestamp
                        }
```

**Room Cleanup:**
- A room is destroyed when all participants leave
- Rooms with zero participants are garbage collected
- No database or persistence layer is needed

**CORS:**
- In development: `origin: "http://localhost:5173"`
- In production: `origin: process.env.CLIENT_URL`

---

## WebRTC Configuration (`client/src/utils/webrtcConfig.js`)

```javascript
export const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};
```

---

## Environment Variables

### Client (`client/.env`)
```
VITE_SERVER_URL=http://localhost:3001
```

### Server (`server/.env`)
```
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Production
- `VITE_SERVER_URL` → Render.com backend URL (e.g., `https://watchtogether-api.onrender.com`)
- `CLIENT_URL` → Vercel frontend URL (e.g., `https://watchtogether.vercel.app`)

---

## Design System

### Color Palette (Dark Theme)
```
Background:       #0f0f0f  (root bg)
Surface:          #1a1a1a  (cards, panels)
Surface Elevated: #242424  (modals, dropdowns)
Border:           #2e2e2e
Primary:          #7c3aed  (purple — buttons, accents)
Primary Hover:    #6d28d9
Success:          #10b981  (green — sharing active)
Danger:           #ef4444  (red — leave, stop sharing)
Text Primary:     #f5f5f5
Text Secondary:   #a1a1aa
Text Muted:       #52525b
```

### Typography
- Font: `Inter` (via Google Fonts or system fallback)
- Base size: 14px
- Code/room codes: `font-mono`

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#1a1a1a",
        "surface-elevated": "#242424",
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
```

---

## Key Implementation Details

### `useWebRTC.js` Hook — Responsibilities
1. Manages a `peers` ref (Map of socketId → SimplePeer instance)
2. When host starts sharing: creates peers for all existing participants, adds stream tracks
3. When a new guest joins (while sharing): creates a new peer for just that guest
4. Handles incoming signals and forwards them to the correct peer
5. When a peer's stream arrives, stores it in state and triggers re-render
6. On cleanup (unmount or leave), destroys all peer connections and stops all tracks

### `useSocket.js` Hook — Responsibilities
1. Creates socket connection to server on mount
2. Emits `join-room` with roomCode and username
3. Returns socket instance + room state (participants, isHost, isHostSharing)
4. Handles all incoming socket events and updates state accordingly
5. Cleans up socket on unmount

### `useChat.js` Hook — Responsibilities
1. Maintains `messages` array in state
2. Exposes `sendMessage(text)` function
3. Listens for `receive-message` and appends to messages array
4. Generates system messages on `user-joined`/`user-left`
5. Returns `{ messages, sendMessage }`

---

## Error Handling

- If `getDisplayMedia()` is denied → toast notification: "Screen share permission denied"
- If `getUserMedia()` is denied → voice chat silently unavailable; mic button hidden
- If peer connection fails → toast: "Connection issue. Try refreshing."
- If room not found on join → redirect to home with error message
- If socket disconnects → show reconnecting indicator; auto-reconnect handled by socket.io

---

## Performance Notes

- The host's browser uploads one stream copy per guest — performance degrades beyond ~6 guests
- Screen share video is NOT recorded or stored anywhere
- Peer connections are destroyed immediately when a participant leaves
- `simple-peer` handles ICE restart automatically on network changes

---

## Limitations (Document in UI)

- DRM-protected content (Netflix, Disney+, Hulu on some browsers) may be blocked by the OS
- The Render.com free tier server sleeps after 15 min inactivity (first load may take 30s)
- Max recommended participants: 6 (performance degrades with more)
- No persistent rooms — rooms exist only while at least one person is connected

---

## Deployment Checklist

1. Push to GitHub (monorepo with `client/` and `server/` folders)
2. Deploy `server/` to Render.com as a Node.js web service, set `PORT` env var
3. Deploy `client/` to Vercel, set `VITE_SERVER_URL` to the Render URL
4. Update `CLIENT_URL` on Render to the Vercel URL
5. Test across two different browsers/devices

---

## README Content

The README should include:
- What the app does
- Live demo link (add after deployment)
- Local development setup instructions
- Known limitations (DRM, guest limit, server sleep)
- Tech stack list
