'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Zap, Trash2, Moon, Sun } from 'lucide-react';
import MeltingCorner from './MeltingCorner';
import { MODE_LABELS, ModeKey } from '@/lib/prompts';
import { supabase } from '@/lib/supabaseClient';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type ChatBoxProps = {
    conversationId: string | null;
    setConversationId: (id: string) => void;
};

export default function ChatBox({ conversationId, setConversationId }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<ModeKey>('classico');
    const [isDark, setIsDark] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load messages when conversationId changes
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            // Optional: reset input or other state
            return;
        }

        const fetchMessages = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('messages')
                .select('role, content')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (data) {
                // cast to correct type if needed
                setMessages(data as Message[]);
            }
            setIsLoading(false);
        };
        fetchMessages();
    }, [conversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle Dark Mode
    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDark]);

    // Effect to apply global theme
    useEffect(() => {
        const body = document.body;
        if (mode === 'caos_total') {
            body.classList.add('caos-mode');
        } else {
            body.classList.remove('caos-mode');
        }
    }, [mode]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: userMsg.content,
                    mode: mode,
                    conversationId: conversationId
                }),
            });

            // Optimistic update or header read
            const newConvId = response.headers.get('X-Conversation-Id');
            if (newConvId && newConvId !== conversationId) {
                setConversationId(newConvId);
            }

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded');
                }
                throw new Error('Network response was not ok');
            }

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            // Add initial AI placeholder
            setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiContent += chunk;

                setMessages((prev) => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = aiContent;
                    }
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '💥 Ocorreu um erro. O sistema explodiu. (Mentira, só deu erro mesmo).' },
            ]);
        } finally {
            setIsLoading(false);
            // Re-focus input after sending
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Effect to apply global theme
    useEffect(() => {
        const body = document.body;
        if (mode === 'caos_total') {
            body.classList.add('caos-mode');
        } else {
            body.classList.remove('caos-mode');
        }
    }, [mode]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-2 md:p-6 transition-colors duration-500 z-10 relative">
            {mode === 'caos_total' && <MeltingCorner />}

            {/* Header */}
            <div className="flex items-center justify-between mb-2 md:mb-6 pb-2 md:pb-4 border-b border-border pl-10 md:pl-0 gap-2">
                <h1 className="flex-1 min-w-0 flex items-center gap-2 text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    <Sparkles className="w-6 h-6 text-purple-500 shrink-0" />
                    <span className="truncate">ChatGPTrouxa</span>
                </h1>
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                        title={isDark ? "Modo Claro" : "Modo Escuro"}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setMessages([])}
                        className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                        title="Limpar tela"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="relative max-w-[110px] md:max-w-none">
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as ModeKey)}
                            className={`w-full appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-purple-500 truncate ${mode === 'caos_total'
                                ? 'bg-red-500 text-white animate-pulse border-red-700'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 border-transparent'
                                }`}
                        >
                            {Object.entries(MODE_LABELS).map(([key, label]) => (
                                <option key={key} value={key} className="bg-white text-black dark:bg-gray-800 dark:text-white">
                                    {label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current">
                            <Zap className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-2 md:mb-4 p-2 md:p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 shadow-inner border border-gray-100 dark:border-zinc-800">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-60">
                        <Sparkles className="w-16 h-16 mb-4" />
                        <p className="text-lg">Digite algo... se tiver coragem.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-4`}
                        >
                            <div
                                className={`max-w-[92%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words
                  ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-bl-none'
                                    }
                `}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative flex items-end gap-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-purple-500">
                <textarea
                    ref={inputRef as any}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Pergunte algo estúpido..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full max-h-32 py-2 pl-2 md:pl-3 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none text-base leading-relaxed scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600"
                    style={{ minHeight: '44px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="mb-1 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

            <div className="text-center mt-2 text-xs text-gray-400">
                ChatGPTrouxa pode gerar informações imprecisas, ofensivas ou simplesmente idiotas.
            </div>
        </div>
    );
}
