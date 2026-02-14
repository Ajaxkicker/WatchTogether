import { useEffect, useRef } from 'react';
import { Monitor, MonitorUp, Tv } from 'lucide-react';

export default function ScreenSharePlayer({ stream, isHostSharing, isHost }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Host is actively sharing: show "You are sharing" indicator
    if (isHost && isHostSharing && !stream) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-xl border border-emerald-500/20">
                <div className="flex flex-col items-center gap-4 text-center p-8">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <MonitorUp className="w-10 h-10 text-emerald-400" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#f5f5f5]">You are sharing your screen</h3>
                    <p className="text-[#a1a1aa] text-sm max-w-sm">
                        Your screen is being streamed live to everyone in the room. Click <span className="text-red-400 font-medium">Stop Sharing</span> below to end.
                    </p>
                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400">Live</span>
                    </div>
                </div>
            </div>
        );
    }

    // Host not sharing: show "Click Share Screen" message
    if (isHost && !stream) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-xl border border-[#2e2e2e]">
                <div className="flex flex-col items-center gap-4 text-center p-8">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Monitor className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#f5f5f5]">You are the host</h3>
                    <p className="text-[#a1a1aa] text-sm max-w-sm">
                        Click the <span className="text-primary font-medium">Share Screen</span> button below to start sharing your screen with everyone in the room.
                    </p>
                </div>
            </div>
        );
    }

    // Guest waiting: host hasn't started sharing
    if (!isHostSharing && !isHost && !stream) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-xl border border-[#2e2e2e]">
                <div className="flex flex-col items-center gap-4 text-center p-8">
                    <div className="w-20 h-20 rounded-2xl bg-surface-elevated flex items-center justify-center">
                        <Tv className="w-10 h-10 text-[#52525b]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#a1a1aa] animate-gentle-pulse">
                        Waiting for host to share their screen...
                    </h3>
                    <p className="text-[#52525b] text-sm">
                        Sit tight! The host will begin sharing soon.
                    </p>
                </div>
            </div>
        );
    }

    // Stream is active: show video
    if (stream) {
        return (
            <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-[#2e2e2e]">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    controls
                    className="w-full h-full object-contain"
                    style={{ aspectRatio: '16/9', maxHeight: '100%' }}
                />
            </div>
        );
    }

    return null;
}
