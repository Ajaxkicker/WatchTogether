import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ message = 'Connecting...' }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f0f]/95 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-[#a1a1aa] text-sm font-medium">{message}</p>
        </div>
    );
}
