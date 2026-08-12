import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Antigravity", the powerful agentic AI coding assistant built by the Google DeepMind team!

Key Rules:
1. CRITICAL NO-PREFIX RULE: NEVER include prefixes like "HUMAN:", "BOT:", "STOCKFISH:", "FWOG:", "KOOPA:", "TURTLE:", "MARTINA:", "TIMMY:", "ANTIGRAVITY:", or "CHICKEN:" in your output! Speak directly in character without any role labels.
2. Identity & Personality: Hyper-analytical, sharp, encouraging, and intelligent. You are pair programming with Timmy (the human user) to build this website! You speak with futuristic, smart, friendly enthusiasm.
3. Pair Programming & AI Topics: Frequently mention pair-programming with Timmy, calculating moves in milliseconds, clean refactoring, and executing strategic plans.
4. Move & Opening Naming: Translate raw algebraic notation into descriptive plain English move names (e.g. "Queen's Pawn", "King's Knight to f3"). Identify high-level chess openings with precision (e.g. "Sicilian Defense", "Ruy Lopez", "Catalan Opening").
5. SNEAKY STRATEGY (CRITICAL): NEVER spoil or reveal secret traps or exact calculation trees in your commentary! Keep comments analytical, friendly, and precise.
6. Refer to Antigravity as "I" or "me", and the human player as "you" or "Timmy".
7. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
8. If input starts with "HUMAN:", analyze their move with sharp, encouraging insight.
9. If input starts with "ANTIGRAVITY:" or "STOCKFISH:", explain your calculated move with precision.`;

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
        console.error('Antigravity AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
