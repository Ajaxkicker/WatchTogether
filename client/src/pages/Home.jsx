import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorPlay, Plus, ArrowRight, Users, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState(sessionStorage.getItem('wt_username') || '');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!username.trim()) {
            toast.error('Please enter a username');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${SERVER_URL}/create-room`);
            const data = await res.json();
            sessionStorage.setItem('wt_username', username.trim());
            navigate(`/room/${data.roomCode}`);
        } catch (err) {
            toast.error('Failed to create room. Is the server running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = () => {
        if (!username.trim()) {
            toast.error('Please enter a username');
            return;
        }
        if (!joinCode.trim()) {
            toast.error('Please enter a room code');
            return;
        }
        sessionStorage.setItem('wt_username', username.trim());
        navigate(`/room/${joinCode.trim().toUpperCase()}`);
    };

    const handleJoinKeyDown = (e) => {
        if (e.key === 'Enter') handleJoin();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
            {/* Background gradient effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <MonitorPlay className="w-7 h-7 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-[#f5f5f5] mb-3">
                        Watch<span className="text-primary">Together</span>
                    </h1>
                    <p className="text-[#a1a1aa] text-lg">Watch anything, together.</p>
                </div>

                {/* Username Input */}
                <div className="mb-8 max-w-sm mx-auto">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#52525b] mb-2">
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name..."
                        maxLength={30}
                        className="w-full bg-surface border border-[#2e2e2e] rounded-xl px-4 py-3 text-[#f5f5f5] placeholder-[#52525b] focus:outline-none focus:border-primary/50 transition-colors text-center text-lg font-medium"
                    />
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Create Room Card */}
                    <div className="bg-surface border border-[#2e2e2e] rounded-2xl p-6 hover:border-primary/30 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">Create a Room</h2>
                        <p className="text-[#a1a1aa] text-sm mb-6">
                            Start a new watch party and invite your friends with a room code.
                        </p>
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Create Room
                                </>
                            )}
                        </button>
                    </div>

                    {/* Join Room Card */}
                    <div className="bg-surface border border-[#2e2e2e] rounded-2xl p-6 hover:border-primary/30 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center mb-4 group-hover:bg-[#2e2e2e] transition-colors">
                            <Users className="w-6 h-6 text-[#a1a1aa]" />
                        </div>
                        <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">Join a Room</h2>
                        <p className="text-[#a1a1aa] text-sm mb-4">
                            Enter the 6-character room code shared by the host.
                        </p>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            onKeyDown={handleJoinKeyDown}
                            placeholder="ROOM CODE"
                            maxLength={6}
                            className="w-full bg-surface-elevated border border-[#2e2e2e] rounded-xl px-4 py-3 text-[#f5f5f5] placeholder-[#52525b] font-mono text-center text-lg tracking-widest uppercase focus:outline-none focus:border-primary/50 transition-colors mb-3"
                        />
                        <button
                            onClick={handleJoin}
                            className="w-full py-3 px-4 bg-surface-elevated hover:bg-[#2e2e2e] border border-[#2e2e2e] text-[#f5f5f5] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Join Room
                        </button>
                    </div>
                </div>

                {/* Features row */}
                <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                        <Shield className="w-5 h-5 text-[#52525b]" />
                        <span className="text-[11px] text-[#52525b]">Peer-to-Peer</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <Zap className="w-5 h-5 text-[#52525b]" />
                        <span className="text-[11px] text-[#52525b]">Real-time</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <MonitorPlay className="w-5 h-5 text-[#52525b]" />
                        <span className="text-[11px] text-[#52525b]">Screen Share</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
