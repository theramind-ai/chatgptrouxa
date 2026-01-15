
import { useEffect, useState } from 'react';
import { Music, X, ExternalLink, Loader2 } from 'lucide-react';

type SpotifyPlayerProps = {
    query: string;
    onClose: () => void;
};

type SpotifyData = {
    found: boolean;
    id?: string;
    name?: string;
    artist?: string;
    uri?: string;
};

export default function SpotifyPlayer({ query, onClose }: SpotifyPlayerProps) {
    const [data, setData] = useState<SpotifyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSpotify = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/spotify/search', {
                    method: 'POST',
                    body: JSON.stringify({ query }),
                });

                if (!res.ok) throw new Error('Search failed');

                const result = await res.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (query) fetchSpotify();
    }, [query]);

    if (!query) return null;

    return (
        <div className="fixed bottom-4 right-4 md:right-8 z-50 w-[90%] md:w-80 bg-black/90 backdrop-blur-md border border-green-500/30 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-900/50 to-black border-b border-white/10">
                <div className="flex items-center gap-2 text-green-400">
                    <Music size={16} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Spotify Agent</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-0 bg-black relative min-h-[80px] flex items-center justify-center">
                {loading && (
                    <div className="flex flex-col items-center gap-2 py-6 text-green-400">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-xs">Buscando "{query}"...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="p-4 text-center text-red-400 text-sm">
                        Erro ao buscar música. O DJ tá surdo.
                    </div>
                )}

                {!loading && data && !data.found && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        Não achei nada com esse nome. Paia.
                    </div>
                )}

                {!loading && data && data.found && data.id && (
                    <iframe
                        style={{ borderRadius: '0 0 12px 12px' }}
                        src={`https://open.spotify.com/embed/track/${data.id}?utm_source=generator&theme=0`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    />
                )}
            </div>

            {!loading && data?.found && (
                <div className="px-3 py-1 bg-green-900/20 flex justify-between items-center text-[10px] text-green-300/60">
                    <span>Tocando agora</span>
                    <ExternalLink size={10} />
                </div>
            )}
        </div>
    );
}
