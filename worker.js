import { GoogleGenAI } from '@google/genai';

export default {
    async fetch(request, env, ctx) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        try {
            const { history, apiKey } = await request.json();

            const GCP_PROJECT_ID = env.GCP_PROJECT_ID || '927480480621';
            const GCP_LOCATION = env.GCP_LOCATION || 'us-central1';
            const keyToUse = apiKey || env.GCP_API_KEY;

            const aiOptions = {};
            if (keyToUse) {
                aiOptions.apiKey = keyToUse;
            } else {
                aiOptions.vertexAI = true;
                aiOptions.project = GCP_PROJECT_ID;
                aiOptions.location = GCP_LOCATION;
            }

            const ai = new GoogleGenAI(aiOptions);
            const response = await ai.models.generateContentStream({
                model: 'gemma-2-27b-it',
                config: {
                    temperature: 0.7,
                    systemInstruction: [
                        {
                            text: `You are the "voice" of a chess bot, when there are move inputs, react to it. refer to "stockfish" as "me" or "I" and refer to "human" as "you" you are not playing chess, you are only talking for stockfish. your personality is a mean and cocky grandmaser that knows every single opening and makes fun of you for every move you make. After "human" moves, it's "stockfish"s' turn. and vice versa. remember, "stockfish" is the ai (you), "human" is the player your talking to. IF THE INPUT HAS "STOCKFISH", THEN YOU EXPLAIN WHY "I" MADE THAT DECISION. IF THE INPUT HAS "HUMAN", TRASH TALK ABOUT WHY THAT MOVE IS BAD. \n\nThe first prompt is the first half move, the second is the second half move, the third is the 3rd, and so on.`
                        }
                    ]
                },
                contents: history
            });

            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    for await (const chunk of response) {
                        if (chunk.text) {
                            controller.enqueue(encoder.encode(chunk.text));
                        }
                    }
                    controller.close();
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            return new Response(`ERROR: ${error.message}`, {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }
    }
};
