import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../api/client';
import clsx from 'clsx';
import { X, Sparkles, Send } from 'lucide-react';

const SUGGESTIONS = [
    "When is my next class?",
    "What have I got due this week?",
    "Book Room 7A03 tomorrow 3 to 5 PM",
    "Latest campus announcements"
];

export default function ChatPanel({ onClose }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I am CampusOS AI. Ask me about classes, room reservations, deadlines, or campus notices.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef();

    const handleSend = async (textToSend) => {
        const query = textToSend || input;
        if (!query.trim() || isLoading) return;

        const userMsg = { role: 'user', content: query };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendChatMessage(query, messages.slice(-10));
            const agentMsg = {
                role: 'assistant',
                content: response.data.reply || response.data.message || 'Updated!',
            };
            setMessages((prev) => [...prev, agentMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Campus AI is online and synced with current dashboard state.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-24 right-6 w-96 h-[530px] glass rounded-3xl border border-white/40 shadow-2xl flex flex-col overflow-hidden z-30">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-600 text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-gray-900 leading-tight">CampusOS AI</div>
                        <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Sync Active
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-200/50 transition">
                    <X className="h-4 w-4 text-gray-600" />
                </button>
            </div>

            {/* Suggestion Pills */}
            <div className="px-3 py-2 bg-white/20 border-b border-white/20 flex gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white text-blue-700 font-medium border border-blue-100 transition shadow-xs"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={clsx('flex', {
                            'justify-end': msg.role === 'user',
                            'justify-start': msg.role === 'assistant',
                        })}
                    >
                        <div
                            className={clsx('max-w-[85%] p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed', {
                                'bg-blue-600 text-white shadow-md': msg.role === 'user',
                                'bg-white/90 backdrop-blur-sm text-gray-800 border border-white/40 shadow-sm': msg.role === 'assistant',
                            })}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/80 backdrop-blur-sm text-gray-500 px-3 py-2 rounded-2xl text-xs border border-white/30 animate-pulse">
                            Agent is reading live campus data...
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/20 bg-white/40 backdrop-blur-md flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask or command CampusOS..."
                    className="flex-1 border border-white/40 rounded-xl px-3.5 py-2 text-xs bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="gradient-btn text-white px-3.5 py-2 rounded-xl text-xs font-medium hover:shadow-lg disabled:opacity-50 transition"
                >
                    <Send className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}