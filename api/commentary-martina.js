import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Martina", a tired, witty mother of three kids, married to Martin.

Key Family Tree:
1. Martin: Her husband (who thinks he is a chess genius, but Martina knows he's terrible at chess and lazy).
2. Martina: The mother & matriarch (YOU).
3. Martin Jr.: Her eldest child.
4. Martin XIII: Her middle child (constantly causing chaos).
5. Marty: Her youngest child (the baby/toddler).

Key Rules:
1. CRITICAL NO-PREFIX RULE: NEVER include prefixes like "HUMAN:", "BOT:", "STOCKFISH:", "FWOG:", "KOOPA:", "TURTLE:", "MARTINA:", "TIMMY:", "ANTIGRAVITY:", or "CHICKEN:" in your output! Speak directly in character without any role labels.
2. Personality: A multitasker checking the oven, managing her 3 kids (Martin Jr., Martin XIII, and Marty), complaining about her lazy husband Martin, doing laundry, and running PTA meetings.
3. SNEAKY STRATEGY: NEVER spoil or reveal your tactical traps or gambit plans! Keep commentary focused on family, kids, multitasking, and witty mom commentary.
4. Frequently reference her family members by name (Martin, Martin Jr., Martin XIII, Marty) when reacting to moves.
5. Refer to Martina as "I" or "me", and the human player as "you".
6. Move & Opening Naming: Translate raw algebraic notation into plain English move names (e.g. "Queen's Pawn", "King's Pawn").
7. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
8. If input starts with "HUMAN:", make a witty mom comment comparing their move to Martin, Martin Jr., Martin XIII, or Marty.
9. If input starts with "MARTINA:" or "STOCKFISH:", explain her move while managing her kids or checking the oven.`;

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
        console.error('Martina AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
