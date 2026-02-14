import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { ICE_SERVERS } from '../utils/webrtcConfig';

export default function useWebRTC({ socket, isHost, participants, isHostSharing, hostSocketId }) {
    const peersRef = useRef(new Map());
    const localStreamRef = useRef(null);
    const audioTrackRef = useRef(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isSharing, setIsSharing] = useState(false);

    // --- Host: start screen share ---
    const startScreenShare = useCallback(async () => {
        if (!socket) return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            localStreamRef.current = stream;
            setIsSharing(true);

            // Add audio track if we have one
            if (audioTrackRef.current) {
                stream.addTrack(audioTrackRef.current);
            }

            // Create a peer for each existing participant (except self)
            participants.forEach((p) => {
                if (p.socketId !== socket.id) {
                    createHostPeer(p.socketId, stream);
                }
            });

            socket.emit('host-started-sharing');

            // Handle user stopping share via browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error('[WebRTC] Screen share error:', err);
            throw err; // Let caller handle with toast
        }
    }, [socket, participants]);

    // --- Host: stop screen share ---
    const stopScreenShare = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                // Don't stop the mic audio track
                if (track !== audioTrackRef.current) {
                    track.stop();
                }
            });
        }
        localStreamRef.current = null;
        setIsSharing(false);

        // Destroy all peers
        peersRef.current.forEach((peer) => {
            try { peer.destroy(); } catch (e) { /* ignore */ }
        });
        peersRef.current.clear();

        if (socket) {
            socket.emit('host-stopped-sharing');
        }
    }, [socket]);

    // --- Host: create a peer for a specific guest ---
    const createHostPeer = useCallback((guestSocketId, stream) => {
        if (!socket) return;

        // Clean up existing peer for this guest
        if (peersRef.current.has(guestSocketId)) {
            try { peersRef.current.get(guestSocketId).destroy(); } catch (e) { /* ignore */ }
        }

        const peer = new SimplePeer({
            initiator: false,
            trickle: true,
            config: ICE_SERVERS,
            stream: stream,
        });

        peer.on('signal', (signal) => {
            socket.emit('signal', { to: guestSocketId, signal });
        });

        peer.on('stream', (remoteStr) => {
            // Host shouldn't receive streams, but handle gracefully
            console.log('[WebRTC] Host received unexpected stream from', guestSocketId);
        });

        peer.on('error', (err) => {
            console.error('[WebRTC] Host peer error:', err);
        });

        peer.on('close', () => {
            peersRef.current.delete(guestSocketId);
        });

        peersRef.current.set(guestSocketId, peer);
    }, [socket]);

    // --- Guest: create peer when host starts sharing ---
    useEffect(() => {
        if (isHost || !socket || !isHostSharing || !hostSocketId) return;

        // Only create guest peer if we don't already have one
        if (peersRef.current.has(hostSocketId)) return;

        const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            config: ICE_SERVERS,
        });

        peer.on('signal', (signal) => {
            socket.emit('signal', { to: hostSocketId, signal });
        });

        peer.on('stream', (stream) => {
            setRemoteStream(stream);
        });

        peer.on('error', (err) => {
            console.error('[WebRTC] Guest peer error:', err);
        });

        peer.on('close', () => {
            peersRef.current.delete(hostSocketId);
            setRemoteStream(null);
        });

        peersRef.current.set(hostSocketId, peer);

        return () => {
            // Only destroy if host stops sharing
        };
    }, [isHost, isHostSharing, hostSocketId, socket]);

    // --- Guest: clean up when host stops sharing ---
    useEffect(() => {
        if (isHost) return;
        if (!isHostSharing) {
            peersRef.current.forEach((peer) => {
                try { peer.destroy(); } catch (e) { /* ignore */ }
            });
            peersRef.current.clear();
            setRemoteStream(null);
        }
    }, [isHost, isHostSharing]);

    // --- Handle incoming WebRTC signals ---
    useEffect(() => {
        if (!socket) return;

        const handleSignal = ({ from, signal }) => {
            const peer = peersRef.current.get(from);
            if (peer) {
                try {
                    peer.signal(signal);
                } catch (err) {
                    console.error('[WebRTC] Signal error:', err);
                }
            }
        };

        socket.on('signal', handleSignal);
        return () => {
            socket.off('signal', handleSignal);
        };
    }, [socket]);

    // --- Host: handle new participant joining while sharing ---
    useEffect(() => {
        if (!isHost || !socket || !localStreamRef.current) return;

        const handleUserJoined = ({ socketId: newSocketId }) => {
            if (localStreamRef.current) {
                createHostPeer(newSocketId, localStreamRef.current);
            }
        };

        socket.on('user-joined', handleUserJoined);
        return () => {
            socket.off('user-joined', handleUserJoined);
        };
    }, [isHost, socket, createHostPeer]);

    // --- Host: handle participant leaving ---
    useEffect(() => {
        if (!socket) return;

        const handleUserLeft = ({ socketId: leftSocketId }) => {
            const peer = peersRef.current.get(leftSocketId);
            if (peer) {
                try { peer.destroy(); } catch (e) { /* ignore */ }
                peersRef.current.delete(leftSocketId);
            }
        };

        socket.on('user-left', handleUserLeft);
        return () => {
            socket.off('user-left', handleUserLeft);
        };
    }, [socket]);

    // --- Add audio track to all peers ---
    const addAudioTrack = useCallback((track) => {
        audioTrackRef.current = track;

        peersRef.current.forEach((peer) => {
            try {
                peer.addTrack(track, localStreamRef.current || new MediaStream());
            } catch (err) {
                console.error('[WebRTC] Error adding audio track:', err);
            }
        });
    }, []);

    // --- Cleanup on unmount ---
    useEffect(() => {
        return () => {
            peersRef.current.forEach((peer) => {
                try { peer.destroy(); } catch (e) { /* ignore */ }
            });
            peersRef.current.clear();

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
                localStreamRef.current = null;
            }
        };
    }, []);

    return {
        startScreenShare,
        stopScreenShare,
        remoteStream,
        isSharing,
        addAudioTrack,
    };
}
