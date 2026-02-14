import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function useSocket({ roomCode, username }) {
    const [participants, setParticipants] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [isHostSharing, setIsHostSharing] = useState(false);
    const [socketId, setSocketId] = useState(null);
    const [connected, setConnected] = useState(false);
    const [hostSocketId, setHostSocketId] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!roomCode || !username) return;

        const socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setSocketId(socket.id);
            setConnected(true);
            socket.emit('join-room', { roomCode, username });
        });

        socket.on('room-joined', (data) => {
            setParticipants(data.participants);
            setIsHost(data.isHost);
            setHostSocketId(data.hostSocketId);
            setIsHostSharing(data.isHostSharing || false);
        });

        socket.on('user-joined', ({ socketId: newSocketId, username: newUsername }) => {
            setParticipants((prev) => {
                if (prev.find((p) => p.socketId === newSocketId)) return prev;
                return [...prev, { socketId: newSocketId, username: newUsername, muted: true, isHost: false }];
            });
        });

        socket.on('user-left', ({ socketId: leftSocketId }) => {
            setParticipants((prev) => prev.filter((p) => p.socketId !== leftSocketId));
        });

        socket.on('host-started-sharing', () => {
            setIsHostSharing(true);
        });

        socket.on('host-stopped-sharing', () => {
            setIsHostSharing(false);
        });

        socket.on('mic-status-update', ({ socketId: sid, muted }) => {
            setParticipants((prev) =>
                prev.map((p) => (p.socketId === sid ? { ...p, muted } : p))
            );
        });

        socket.on('new-host', ({ hostSocketId: newHostId }) => {
            setHostSocketId(newHostId);
            setIsHost(socket.id === newHostId);
            setParticipants((prev) =>
                prev.map((p) => ({ ...p, isHost: p.socketId === newHostId }))
            );
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('error', (data) => {
            console.error('[Socket Error]', data.message);
        });

        return () => {
            socket.off('connect');
            socket.off('room-joined');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('host-started-sharing');
            socket.off('host-stopped-sharing');
            socket.off('mic-status-update');
            socket.off('new-host');
            socket.off('disconnect');
            socket.off('error');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomCode, username]);

    return {
        socket: socketRef.current,
        participants,
        isHost,
        isHostSharing,
        socketId,
        connected,
        hostSocketId,
    };
}
