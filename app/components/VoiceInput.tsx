
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, SendHorizontal, Keyboard } from 'lucide-react';

type VoiceInputProps = {
    onTranscription: (text: string) => void;
    onAutoSend: (text: string) => void;
    disabled?: boolean;
};

export default function VoiceInput({ onTranscription, onAutoSend, disabled }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoSend, setAutoSend] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check if Web Speech API is supported
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            console.warn('Web Speech API not supported in this browser');
            return;
        }

        // Initialize Speech Recognition
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR'; // Portuguese (Brazil)
        recognition.continuous = false; // Stop after one result
        recognition.interimResults = false; // Only final results
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
            setIsProcessing(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;

            if (autoSend) {
                onAutoSend(transcript);
            } else {
                onTranscription(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            setIsProcessing(false);

            if (event.error === 'no-speech') {
                alert('Não detectei nenhuma fala. Tente novamente.');
            } else if (event.error === 'not-allowed') {
                alert('Permissão de microfone negada. Habilite nas configurações do navegador.');
            } else {
                alert(`Erro ao reconhecer fala: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            setIsProcessing(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [autoSend, onTranscription, onAutoSend]);

    const startRecording = () => {
        if (!recognitionRef.current || !isSupported) {
            alert('Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.');
            return;
        }

        try {
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            alert('Erro ao iniciar gravação. Tente novamente.');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsProcessing(true);
        }
    };

    if (!isSupported) {
        return null; // Hide button if not supported
    }

    return (
        <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <button
                onClick={() => setAutoSend(!autoSend)}
                className={`hidden md:flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${autoSend
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                    }`}
                title={autoSend ? "Modo Walkie-Talkie: Envia direto" : "Modo Revisão: Edite antes de enviar"}
            >
                {autoSend ? <SendHorizontal size={12} /> : <Keyboard size={12} />}
                <span>{autoSend ? 'Auto' : 'Review'}</span>
            </button>

            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled || isProcessing}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : isProcessing
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : 'bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300'
                    }`}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                    <Square className="w-5 h-5 fill-current" />
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </button>
        </div>
    );
}
