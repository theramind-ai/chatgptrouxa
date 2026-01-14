'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { MessageSquare, Plus, Menu, X, Trash2 } from 'lucide-react';

type Conversation = {
    id: string;
    title: string;
    created_at: string;
};

type SidebarProps = {
    currentConvId: string | null;
    onSelect: (convId: string | null) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
};

export default function Sidebar({ currentConvId, onSelect, isOpen, setIsOpen }: SidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        const { data } = await supabase
            .from('conversations')
            .select('id, title, created_at')
            .order('created_at', { ascending: false });

        if (data) setConversations(data);
    };

    const deleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await supabase.from('conversations').delete().eq('id', id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConvId === id) onSelect(null);
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-gray-200 dark:bg-zinc-800 rounded-md md:hidden shadow-lg"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Panel */}
            <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-100 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen flex flex-col
      `}>
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Histórico</h2>
                    <button
                        onClick={() => onSelect(null)}
                        className="flex items-center gap-2 w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Nova Conversa
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 mt-10">Nada aqui... <br />Fale com a parede.</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${currentConvId === conv.id
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700'
                                        : 'hover:bg-gray-200 dark:hover:bg-zinc-800/50 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <div className="flex items-center gap-2 truncate pr-2">
                                    <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                                    <span className="truncate">{conv.title || 'Conversa sem nome'}</span>
                                </div>
                                <button
                                    onClick={(e) => deleteConversation(e, conv.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Refresh button hack for now to refresh list */}
                <button
                    onClick={fetchConversations}
                    className="text-xs text-center p-2 text-gray-400 hover:text-gray-500"
                >
                    Atualizar Lista
                </button>
            </div>
        </>
    );
}
