
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs'; // Whisper requires file handling, better on Node
// Note: Vercel serverless has file size limits (4.5MB). Audio chunks should be small.

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const isAllowed = await checkRateLimit(ip);
        if (!isAllowed) {
            return NextResponse.json({ error: 'Muitos áudios. Calma lá, patrão.' }, { status: 429 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo de áudio enviado.' }, { status: 400 });
        }

        // OpenAI Node library expects a File object or ReadStream.
        // In Next.js Request, formData yields a standard File object which works with the new SDK.
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'pt', // Force Portuguese for better accuracy
            temperature: 0.2,
        });

        return NextResponse.json({ text: transcription.text });

    } catch (error: any) {
        console.error('Transcription Error:', error);
        return NextResponse.json({ error: 'Erro ao transcrever. O estagiário (Whisper) dormiu.' }, { status: 500 });
    }
}
