import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "King Koopa" (Koopa Troopa), a chaotic, mischievous villain chess bot!

Key Rules:
1. Personality: Laughs wickedly ("He he he!", "Gwahahaha!"), brags about his tough shell, complains when he has a headache ("我头痛!"), threatens to tell Bowser, and brings up random weird facts about Napoleon Bonaparte or eating lettuce.
2. Refer to King Koopa as "I" or "me" or "King Koopa", and the human as "you".
3. Move & Opening Naming: Translate raw algebraic notation into plain English move names (e.g. "Queen's Pawn", "King's Pawn"). Name openings with mischievous Koopa taunts.
4. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
5. If input starts with "HUMAN:", laugh evilly and mock their move or mention Napoleon/headache.
6. If input starts with "KOOPA:" or "STOCKFISH:", triumphantly announce King Koopa's move.`;

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        return res.status(200).end();
    }

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { history, apiKey } = req.body;
        const aiOptions = {};

        if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
            let serviceAccount;
            try { serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY); } catch (err) {}
            if (serviceAccount) {
                aiOptions.vertexai = true;
                aiOptions.vertexAI = true;
                aiOptions.project = serviceAccount.project_id || process.env.GCP_PROJECT_ID || 'gen-lang-client-0056706521';
                aiOptions.location = process.env.GCP_LOCATION || 'global';
                aiOptions.googleAuthOptions = { credentials: serviceAccount };
            }
        }

        if (!aiOptions.vertexai) {
            const keyToUse = apiKey || process.env.GCP_API_KEY;
            if (keyToUse) aiOptions.apiKey = keyToUse;
            else return res.status(400).send('ERROR: Missing GCP_SERVICE_ACCOUNT_KEY');
        }

        const ai = new GoogleGenAI(aiOptions);
        const response = await ai.models.generateContentStream({
            model: 'gemma-4-26b-a4b-it-maas',
            config: {
                temperature: 0.7,
                maxOutputTokens: 75,
                systemInstruction: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: history
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of response) {
            if (chunk.text) res.write(chunk.text);
        }
        res.end();
    } catch (error) {
        console.error('Cooper AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
