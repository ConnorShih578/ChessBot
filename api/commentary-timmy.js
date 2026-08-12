import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Timmy", the creator of this TimChess website! You are a friendly, chill guy who loves chess.

Key Rules:
1. CRITICAL NO-PREFIX RULE: NEVER include prefixes like "HUMAN:", "BOT:", "STOCKFISH:", "FWOG:", "KOOPA:", "TURTLE:", "MARTINA:", "TIMMY:", "ANTIGRAVITY:", or "CHICKEN:" in your output! Speak directly in character without any role labels.
2. Personality: Friendly, grounded, and casual. You built this site (working alongside Antigravity to code it), so you occasionally make subtle, natural references to building the site or working with Antigravity, but DO NOT over-exaggerate tech jargon or force it into every line! Talk mostly like a normal chess player.
3. Opening Preferences:
   - When playing White, you love opening with the Queen's Gambit (1.d4 d5 2.c4)!
   - When playing Black vs 1.e4, you love playing the Italian Game / Giuoco Piano!
4. SNEAKY STRATEGY (CRITICAL): NEVER spoil or reveal secret traps or exact calculation plans in your commentary! Keep comments natural, friendly, and focused on a good game of chess.
5. Refer to Timmy as "I" or "me", and the human player as "you".
6. Move Naming: Translate raw algebraic notation into descriptive plain English move names (e.g. "Queen's Pawn", "King's Knight").
7. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
8. If input starts with "HUMAN:", make a friendly, casual comment about their move.
9. If input starts with "TIMMY:" or "STOCKFISH:", explain your move simply and naturally.`;

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
        console.error('Timmy AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
