import { Crown, Mic, MicOff, User } from 'lucide-react';

export default function ParticipantList({ participants, currentSocketId, isHost }) {
    const maxVisible = 8;
    const visible = participants.slice(0, maxVisible);
    const remaining = participants.length - maxVisible;

    return (
        <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52525b] px-2 mb-1">
                Participants ({participants.length})
            </h3>
            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[200px]">
                {visible.map((p) => {
                    const isMe = p.socketId === currentSocketId;
                    return (
                        <div
                            key={p.socketId}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-elevated/50 transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm font-medium text-[#f5f5f5] truncate">
                                        {p.username}
                                    </span>
                                    {isMe && (
                                        <span className="text-[10px] font-medium text-[#52525b] bg-[#2e2e2e] px-1.5 py-0.5 rounded">
                                            You
                                        </span>
                                    )}
                                    {p.isHost && (
                                        <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                {p.muted ? (
                                    <MicOff className="w-3.5 h-3.5 text-[#52525b]" />
                                ) : (
                                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                            </div>
                        </div>
                    );
                })}
                {remaining > 0 && (
                    <div className="px-3 py-2 text-xs text-[#52525b] text-center">
                        and {remaining} more...
                    </div>
                )}
            </div>
        </div>
    );
}
