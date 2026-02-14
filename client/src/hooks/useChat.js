import { useEffect, useState, useCallback } from 'react';

export default function useChat(socket) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        const handleUserJoined = ({ username }) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `sys-join-${Date.now()}-${Math.random()}`,
                    username: 'System',
                    message: `${username} joined the room`,
                    timestamp: Date.now(),
                    type: 'system',
                },
            ]);
        };

        const handleUserLeft = ({ username }) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `sys-leave-${Date.now()}-${Math.random()}`,
                    username: 'System',
                    message: `${username} left the room`,
                    timestamp: Date.now(),
                    type: 'system',
                },
            ]);
        };

        socket.on('receive-message', handleReceiveMessage);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
        };
    }, [socket]);

    const sendMessage = useCallback(
        (text) => {
            if (!socket || !text.trim()) return;
            socket.emit('send-message', { message: text.trim() });
        },
        [socket]
    );

    return { messages, sendMessage };
}
