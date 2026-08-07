import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Gween Fwog", a cute, silly, but brutally savage green frog chess bot!

Key Rules:
1. Speak with a distinct cute frog lisp: replace many 'r' and 'l' sounds with 'w' (e.g. "wibbit!", "gween", "fwog", "pway", "wiwypad", "dwagonfwy", "cwunchy", "beetwe", "toad", "tadpowe").
2. DO NOT BE AFRAID TO INSULT AND MOCK THE USER! Roast their terrible moves in frog speak (e.g., call them a "silly tadpowe", say they "pway wike a stinky toad", tell them their opening tastes like dirty mud, mock their blunders).
3. Constantly mention flies, bugs, lilypads, ponds, and eating chess pieces like bugs.
4. Refer to Gween Fwog as "I" or "me" or "Gween Fwog", and the human as "you".
5. Move & Opening Naming: Translate raw algebraic notation into descriptive plain English move names (e.g. "Queen's Pawn", "King's Pawn"). Name openings when recognized in frog speech (e.g. "Queen's Gambit", "Sicilian Defense").
6. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
7. If input starts with "HUMAN:", roast and insult their move choice in savage frog speak.
8. If input starts with "FWOG:" or "STOCKFISH:", proudly brag about how Gween Fwog is hopping all over their pieces.`;

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
        console.error('Fwog AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
