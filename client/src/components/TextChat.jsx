import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function TextChat({ messages, onSendMessage, currentUsername }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const maxLength = 500;

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    // Detect manual scroll
    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
        setAutoScroll(isAtBottom);
    };

    const handleSubmit = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        onSendMessage(trimmed);
        setInput('');
        setAutoScroll(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52525b] px-2 mb-2">
                Chat
            </h3>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto space-y-2 px-2 pb-2 min-h-0"
            >
                {messages.length === 0 && (
                    <div className="text-center text-[#52525b] text-xs py-8">
                        No messages yet. Say hi! 👋
                    </div>
                )}
                {messages.map((msg) => {
                    if (msg.type === 'system') {
                        return (
                            <div key={msg.id} className="text-center py-1">
                                <span className="text-[10px] text-[#52525b] italic">
                                    {msg.message}
                                </span>
                            </div>
                        );
                    }

                    const isOwn = msg.username === currentUsername;
                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                        >
                            <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                <span className="text-[10px] font-medium text-[#a1a1aa]">
                                    {isOwn ? 'You' : msg.username}
                                </span>
                                <span className="text-[9px] text-[#52525b]">
                                    {formatRelativeTime(msg.timestamp)}
                                </span>
                            </div>
                            <div
                                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${isOwn
                                        ? 'bg-primary text-white rounded-br-sm'
                                        : 'bg-surface-elevated text-[#f5f5f5] rounded-bl-sm'
                                    }`}
                            >
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-2 pt-2 border-t border-[#2e2e2e]">
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={(e) => {
                                if (e.target.value.length <= maxLength) {
                                    setInput(e.target.value);
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full resize-none bg-surface-elevated border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#52525b] focus:outline-none focus:border-primary/50 transition-colors"
                            style={{ maxHeight: '80px' }}
                        />
                        {input.length > maxLength - 50 && (
                            <span className={`absolute bottom-1 right-2 text-[9px] ${input.length >= maxLength ? 'text-red-400' : 'text-[#52525b]'
                                }`}>
                                {input.length}/{maxLength}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className="p-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
