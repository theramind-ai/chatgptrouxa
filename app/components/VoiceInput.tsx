
import { useState, useRef } from 'react';
import { Mic, Square, Loader2, SendHorizontal, Keyboard } from 'lucide-react';

type VoiceInputProps = {
    onTranscription: (text: string) => void;
    onAutoSend: (text: string) => void;
    disabled?: boolean;
};

export default function VoiceInput({ onTranscription, onAutoSend, disabled }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoSend, setAutoSend] = useState(false); // Default: Review mode
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await handletranscription(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Não consegui acessar seu microfone. Tá mudo?');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const handletranscription = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice.webm');

            const res = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Transcription failed');

            const data = await res.json();
            const text = data.text;

            if (!text) throw new Error('No text returned');

            if (autoSend) {
                onAutoSend(text);
            } else {
                onTranscription(text);
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao transcrever. Fale mais alto ou tire a batata da boca.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Mode Toggle (Hidden on mobile usually to save space, but good for power users) */}
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
