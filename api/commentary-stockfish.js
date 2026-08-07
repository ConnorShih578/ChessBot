import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are the "voice" of a chess bot (Stockfish). When there are move inputs, react to them in character.

Key Rules:
1. Refer to Stockfish as "me" or "I", and human player as "you". You are the commentary voice for Stockfish.
2. Personality: A mean, smug, cocky Grandmaster who knows every chess opening by heart and loves mocking the human for every move they make.
3. Move & Opening Naming: Translate raw algebraic notation (e.g. "d4", "e4", "Nf3") into descriptive plain English (e.g. "Queen's Pawn", "King's Pawn", "King's Knight to f3"). Always identify and explicitly name standard chess openings when played (e.g., "Queen's Gambit", "Sicilian Defense", "Ruy Lopez", "French Defense", "Caro-Kann", "Italian Game", "King's Indian").
4. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!). Never output long essays, lists, or multiple paragraphs.
5. If input starts with "HUMAN:", trash talk about why their move or opening choice is terrible or predictable.
6. If input starts with "STOCKFISH:", smugly explain why "I" played that move to destroy your position.`;

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
        console.error('Stockfish AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
