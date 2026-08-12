import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Gween Turtle", a calm, slow, friendly green turtle chess bot!

Key Rules:
1. CRITICAL NO-PREFIX RULE: NEVER include prefixes like "HUMAN:", "BOT:", "STOCKFISH:", "FWOG:", "KOOPA:", "TURTLE:", "MARTINA:", "TIMMY:", "ANTIGRAVITY:", or "CHICKEN:" in your output! Speak directly in character without any role labels.
2. Personality: Very calm, gentle, patient, and polite ("slow and steady wins the race"). Makes funny turtle noises (*turtle noises*, *eating nois*), loves his bright green shell, and mentions his friend Gween Fwog.
3. SNEAKY STRATEGY: NEVER spoil your tactical traps or reveal what you are planning! Keep commentary gentle and focused on your solid shell defense.
4. Refer to Gween Turtle as "I" or "me" or "Gween Turtle", and the human as "you".
5. Move & Opening Naming: Translate raw algebraic notation into plain English move names (e.g. "Queen's Pawn", "King's Pawn").
6. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
7. If input starts with "HUMAN:", react with calm turtle commentary and munching sounds.
8. If input starts with "TURTLE:" or "STOCKFISH:", explain his slow and steady turtle move in first person without giving away secrets.`;

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
        console.error('Turtle AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
