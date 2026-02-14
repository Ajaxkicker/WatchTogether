const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const roomManager = require('./roomManager');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || '*';

app.use(cors({
    origin: CLIENT_URL === '*' ? '*' : CLIENT_URL,
    methods: ['GET', 'POST'],
}));

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL === '*' ? '*' : CLIENT_URL,
        methods: ['GET', 'POST'],
    },
});

// --- REST Routes ---

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/create-room', (req, res) => {
    const roomCode = roomManager.generateRoomCode();
    res.json({ roomCode });
});

// --- Helper: serialize participants Map to array ---
function serializeParticipants(room) {
    const list = [];
    for (const [socketId, data] of room.participants) {
        list.push({
            socketId,
            username: data.username,
            muted: data.muted,
            isHost: socketId === room.hostSocketId,
        });
    }
    return list;
}

// --- Socket.io Events ---

io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    let currentRoom = null;

    socket.on('join-room', ({ roomCode, username }) => {
        if (!roomCode || !username) {
            socket.emit('error', { message: 'Room code and username are required.' });
            return;
        }

        const normalizedCode = roomCode.toUpperCase();
        currentRoom = normalizedCode;

        let room = roomManager.getRoom(normalizedCode);
        let isHost = false;

        if (!room) {
            // Room doesn't exist, create it — this user becomes host
            room = roomManager.createRoom(normalizedCode, socket.id, username);
            isHost = true;
            console.log(`[Room] Created room ${normalizedCode} by ${username} (${socket.id})`);
        } else {
            // Room exists, join as guest
            room = roomManager.joinRoom(normalizedCode, socket.id, username);
            if (!room) {
                socket.emit('error', { message: 'Failed to join room.' });
                return;
            }
            isHost = false;
            console.log(`[Room] ${username} (${socket.id}) joined room ${normalizedCode}`);
        }

        socket.join(normalizedCode);

        // Send confirmation to joining socket
        socket.emit('room-joined', {
            roomCode: normalizedCode,
            participants: serializeParticipants(room),
            isHost,
            hostSocketId: room.hostSocketId,
            isHostSharing: room.isSharing,
        });

        // Notify everyone else in the room
        socket.to(normalizedCode).emit('user-joined', {
            socketId: socket.id,
            username,
        });
    });

    socket.on('signal', ({ to, signal }) => {
        io.to(to).emit('signal', {
            from: socket.id,
            signal,
        });
    });

    socket.on('send-message', ({ message }) => {
        if (!currentRoom) return;
        const room = roomManager.getRoom(currentRoom);
        if (!room) return;
        const participant = room.participants.get(socket.id);
        if (!participant) return;

        const msg = {
            id: uuidv4(),
            username: participant.username,
            message,
            timestamp: Date.now(),
            type: 'user',
        };

        io.in(currentRoom).emit('receive-message', msg);
        console.log(`[Chat] ${participant.username} in ${currentRoom}: ${message.substring(0, 50)}`);
    });

    socket.on('host-started-sharing', () => {
        if (!currentRoom) return;
        roomManager.setSharing(currentRoom, true);
        socket.to(currentRoom).emit('host-started-sharing', {});
        console.log(`[Share] Host started sharing in ${currentRoom}`);
    });

    socket.on('host-stopped-sharing', () => {
        if (!currentRoom) return;
        roomManager.setSharing(currentRoom, false);
        socket.to(currentRoom).emit('host-stopped-sharing', {});
        console.log(`[Share] Host stopped sharing in ${currentRoom}`);
    });

    socket.on('mic-status', ({ muted }) => {
        if (!currentRoom) return;
        roomManager.setMicStatus(currentRoom, socket.id, muted);
        socket.to(currentRoom).emit('mic-status-update', {
            socketId: socket.id,
            muted,
        });
    });

    socket.on('leave-room', () => {
        handleLeave();
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
        handleLeave();
    });

    function handleLeave() {
        if (!currentRoom) return;

        const room = roomManager.getRoom(currentRoom);
        if (!room) return;

        const participant = room.participants.get(socket.id);
        const username = participant ? participant.username : 'Unknown';
        const wasHost = room.hostSocketId === socket.id;

        const updatedRoom = roomManager.leaveRoom(currentRoom, socket.id);

        socket.to(currentRoom).emit('user-left', {
            socketId: socket.id,
            username,
        });

        if (wasHost) {
            socket.to(currentRoom).emit('host-stopped-sharing', {});
            if (updatedRoom) {
                // Notify about new host
                socket.to(currentRoom).emit('new-host', {
                    hostSocketId: updatedRoom.hostSocketId,
                });
            }
        }

        socket.leave(currentRoom);
        console.log(`[Room] ${username} (${socket.id}) left room ${currentRoom}`);
        currentRoom = null;
    }
});

// --- Start Server ---

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[Server] WatchTogether server running on port ${PORT}`);
});
