import { Mic, MicOff } from 'lucide-react';

export default function VoiceControls({ isMuted, onToggleMute, hasPermission, onRequestPermission }) {
    if (!hasPermission) {
        return (
            <button
                onClick={onRequestPermission}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-elevated hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded-xl text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors"
            >
                <Mic className="w-4 h-4" />
                Enable Mic
            </button>
        );
    }

    return (
        <div className="relative">
            {/* Pulse ring when unmuted */}
            {!isMuted && (
                <span className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-pulse-ring pointer-events-none" />
            )}
            <button
                onClick={onToggleMute}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isMuted
                        ? 'bg-surface-elevated border border-[#2e2e2e] text-[#a1a1aa] hover:text-white hover:bg-[#2e2e2e]'
                        : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                    }`}
            >
                {isMuted ? (
                    <>
                        <MicOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Muted</span>
                    </>
                ) : (
                    <>
                        <Mic className="w-4 h-4" />
                        <span className="hidden sm:inline">Mic On</span>
                    </>
                )}
            </button>
        </div>
    );
}
