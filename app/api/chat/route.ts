import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { openai } from '@/lib/openaiClient';
import { checkRateLimit } from '@/lib/rateLimiter';
import { BASE_PROMPT, MODES, ModeKey } from '@/lib/prompts';

export const runtime = 'nodejs'; // Use nodejs runtime for compatibility (or 'edge' if preferred but supabase-js works fine in node)

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // 1. Rate Limit
        const isAllowed = await checkRateLimit(ip);
        if (!isAllowed) {
            return NextResponse.json(
                { error: 'Calma lá, meu consagrado! Muitas perguntas. Espere um minuto.' },
                { status: 429 }
            );
        }

        const { content, mode, conversationId } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Faltou o texto, gênio.' }, { status: 400 });
        }

        // For now, hardcode userId. In a real app, this would come from auth.
        const userId = 'anonymous_user';
        let activeConversationId = conversationId;

        // A. If no conversationId, create one
        if (!activeConversationId) {
            const { data: conv, error } = await supabase.from('conversations').insert({
                title: content.substring(0, 30) + '...',
                user_id: userId
            }).select('id').single(); // Use .select('id').single() instead of .selectSingle()

            if (conv) activeConversationId = conv.id;
        }

        // B. Fetch Context (Previous Messages)
        let contextMessages: any[] = [];
        if (activeConversationId) {
            const { data: prevMsgs } = await supabase.from('messages')
                .select('role, content')
                .eq('conversation_id', activeConversationId)
                .order('created_at', { ascending: true })
                .limit(10); // Context window of last 10 messages

            if (prevMsgs) {
                contextMessages = prevMsgs.map(m => ({ role: m.role, content: m.content }));
            }
        }

        // 2. Prepare Prompt with Context (Memory)
        // Default to 'classico' if invalid mode invalid
        const selectedMode = (MODES[mode as ModeKey] ? mode : 'classico') as ModeKey;
        const modeInstruction = MODES[selectedMode];

        const messages = [
            { role: 'system', content: `${BASE_PROMPT}\n${modeInstruction}` },
            ...contextMessages,
            { role: 'user', content }
        ];

        // 3. Call OpenAI with Streaming
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages as any,
            stream: true,
        });

        // Capture the ID here for the closure
        const finalConversationId = activeConversationId;
        const finalUserId = userId; // Also capture userId to be safe although it's const

        // 4. Create Stream response
        const encoder = new TextEncoder();

        // Create a TransformStream to process the chunks and log to DB asynchronously
        const customStream = new ReadableStream({
            async start(controller) {
                let fullResponse = '';

                for await (const chunk of stream) {
                    const delta = chunk.choices[0]?.delta?.content || '';
                    if (delta) {
                        fullResponse += delta;
                        controller.enqueue(encoder.encode(delta));
                    }
                }
                controller.close();

                // 5. Fire-and-forget logging to Supabase
                try {
                    (async () => {
                        // Insert User Message
                        await supabase.from('messages').insert({
                            conversation_id: finalConversationId,
                            content: content,
                            role: 'user',
                            user_id: userId,
                            metadata: { mode, ip }
                        });

                        // Insert AI Response
                        await supabase.from('messages').insert({
                            conversation_id: finalConversationId,
                            content: fullResponse,
                            role: 'assistant',
                            user_id: userId,
                            metadata: { mode }
                        });
                    })();
                } catch (err) {
                    console.error('Error logging to supabase', err);
                }
            },
        });

        return new NextResponse(customStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Conversation-Id': finalConversationId || '',
            },
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'O cérebro positrônico pifou. Tente de novo.' },
            { status: 500 }
        );
    }
}
