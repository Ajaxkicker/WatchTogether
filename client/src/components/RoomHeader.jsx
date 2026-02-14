import { useState } from 'react';
import { Users, Copy, Link, LogOut, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomHeader({ roomCode, participantCount, isSharing, onLeave }) {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        toast.success('Room code copied!');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
    };

    return (
        <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-[#2e2e2e]">
            {/* Left: Logo + Room Code */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <MonitorPlay className="w-6 h-6 text-primary" />
                    <span className="text-lg font-bold hidden sm:inline">WatchTogether</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated rounded-lg border border-[#2e2e2e] hover:border-primary/50 transition-colors"
                        title="Click to copy room code"
                    >
                        <span className="font-mono text-sm font-semibold tracking-wider">{roomCode}</span>
                        <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    </button>

                    {isSharing && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </span>
                    )}
                </div>
            </div>

            {/* Right: Participants + Actions */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[#a1a1aa] text-sm">
                    <Users className="w-4 h-4" />
                    <span>{participantCount}</span>
                </div>

                <button
                    onClick={handleShareLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a1a1aa] hover:text-white bg-surface-elevated rounded-lg border border-[#2e2e2e] hover:border-[#3f3f46] transition-colors"
                    title="Copy invite link"
                >
                    <Link className="w-4 h-4" />
                    <span className="hidden sm:inline">Invite</span>
                </button>

                <button
                    onClick={onLeave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Leave</span>
                </button>
            </div>
        </header>
    );
}
