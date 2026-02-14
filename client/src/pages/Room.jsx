import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Monitor, MonitorOff, MessageSquare, X } from 'lucide-react';
import useSocket from '../hooks/useSocket';
import useWebRTC from '../hooks/useWebRTC';
import useChat from '../hooks/useChat';
import RoomHeader from '../components/RoomHeader';
import ScreenSharePlayer from '../components/ScreenSharePlayer';
import ParticipantList from '../components/ParticipantList';
import TextChat from '../components/TextChat';
import VoiceControls from '../components/VoiceControls';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Room() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const username = sessionStorage.getItem('wt_username');

    const [isMuted, setIsMuted] = useState(true);
    const [hasMicPermission, setHasMicPermission] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const audioTrackRef = useRef(null);

    // Redirect if no username
    useEffect(() => {
        if (!username) {
            toast.error('Please enter a username first');
            navigate('/');
        }
    }, [username, navigate]);

    // Initialize hooks
    const {
        socket,
        participants,
        isHost,
        isHostSharing,
        socketId,
        connected,
        hostSocketId,
    } = useSocket({ roomCode, username });

    const {
        startScreenShare,
        stopScreenShare,
        remoteStream,
        isSharing,
        addAudioTrack,
    } = useWebRTC({ socket, isHost, participants, isHostSharing, hostSocketId });

    const { messages, sendMessage } = useChat(socket);

    // Handle screen share
    const handleStartShare = async () => {
        try {
            await startScreenShare();
            toast.success('Screen sharing started');
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                toast.error('Screen share permission denied');
            } else {
                toast.error('Failed to start screen sharing');
            }
        }
    };

    const handleStopShare = () => {
        stopScreenShare();
        toast.success('Screen sharing stopped');
    };

    // Handle mic permission
    const handleRequestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioTrack = stream.getAudioTracks()[0];
            audioTrackRef.current = audioTrack;
            audioTrack.enabled = false; // Start muted
            setHasMicPermission(true);
            setIsMuted(true);
            addAudioTrack(audioTrack);
            toast.success('Microphone enabled');
        } catch (err) {
            toast.error('Microphone permission denied');
            console.error('[Mic] Permission error:', err);
        }
    };

    // Handle mic toggle
    const handleToggleMute = useCallback(() => {
        if (!audioTrackRef.current) return;
        const newMuted = !isMuted;
        audioTrackRef.current.enabled = !newMuted;
        setIsMuted(newMuted);
        if (socket) {
            socket.emit('mic-status', { muted: newMuted });
        }
    }, [isMuted, socket]);

    // Handle leave room
    const handleLeave = useCallback(() => {
        if (audioTrackRef.current) {
            audioTrackRef.current.stop();
            audioTrackRef.current = null;
        }
        stopScreenShare();
        if (socket) {
            socket.emit('leave-room');
        }
        navigate('/');
    }, [socket, stopScreenShare, navigate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioTrackRef.current) {
                audioTrackRef.current.stop();
            }
        };
    }, []);

    if (!username) return null;

    if (!connected) {
        return <LoadingOverlay message="Connecting to room..." />;
    }

    return (
        <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
            {/* Header */}
            <RoomHeader
                roomCode={roomCode}
                participantCount={participants.length}
                isSharing={isSharing || isHostSharing}
                onLeave={handleLeave}
            />

            {/* Main Content */}
            <div className="flex-1 flex min-h-0">
                {/* Video + Controls Area */}
                <div className="flex-1 flex flex-col p-3 gap-3 min-w-0">
                    {/* Video Area */}
                    <ScreenSharePlayer
                        stream={isHost ? null : remoteStream}
                        isHostSharing={isHostSharing || isSharing}
                        isHost={isHost}
                    />

                    {/* Controls Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-xl border border-[#2e2e2e]">
                        <div className="flex items-center gap-3">
                            <VoiceControls
                                isMuted={isMuted}
                                onToggleMute={handleToggleMute}
                                hasPermission={hasMicPermission}
                                onRequestPermission={handleRequestMic}
                            />

                            {isHost && (
                                <>
                                    {!isSharing ? (
                                        <button
                                            onClick={handleStartShare}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors text-sm"
                                        >
                                            <Monitor className="w-4 h-4" />
                                            <span className="hidden sm:inline">Share Screen</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStopShare}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-medium rounded-xl transition-colors text-sm"
                                        >
                                            <MonitorOff className="w-4 h-4" />
                                            <span className="hidden sm:inline">Stop Sharing</span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile chat toggle */}
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-surface-elevated rounded-lg border border-[#2e2e2e] text-[#a1a1aa] hover:text-white transition-colors text-sm"
                        >
                            {showChat ? (
                                <X className="w-4 h-4" />
                            ) : (
                                <>
                                    <MessageSquare className="w-4 h-4" />
                                    {messages.length > 0 && (
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sidebar (Participants + Chat) */}
                <div
                    className={`${showChat ? 'flex' : 'hidden'
                        } lg:flex w-full lg:w-80 flex-col border-l border-[#2e2e2e] bg-surface absolute lg:relative inset-0 lg:inset-auto top-14 lg:top-0 z-40 lg:z-auto`}
                >
                    {/* Participants */}
                    <div className="p-3 border-b border-[#2e2e2e]">
                        <ParticipantList
                            participants={participants}
                            currentSocketId={socketId}
                            isHost={isHost}
                        />
                    </div>

                    {/* Chat */}
                    <div className="flex-1 flex flex-col p-3 min-h-0">
                        <TextChat
                            messages={messages}
                            onSendMessage={sendMessage}
                            currentUsername={username}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
