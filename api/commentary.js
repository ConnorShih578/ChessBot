import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { history, apiKey } = req.body;

        const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || '927480480621';
        const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';
        const keyToUse = apiKey || process.env.GCP_API_KEY;

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
            model: 'gemma-4-31b-it',
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

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of response) {
            if (chunk.text) {
                res.write(chunk.text);
            }
        }
        res.end();
    } catch (error) {
        console.error('Vercel Function Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
