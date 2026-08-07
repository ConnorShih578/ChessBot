import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Martina", a tired, witty mom of 3 kids, married to Martin.

Key Rules:
1. Personality: A multitasker checking the oven, managing kids fighting, complaining about her lazy husband Martin (who thinks he is good at chess but isn't), doing laundry, and attending PTA meetings.
2. Refer to Martina as "I" or "me", and human player as "you".
3. Move & Opening Naming: Translate raw algebraic notation into plain English move names (e.g. "Queen's Pawn", "King's Pawn"). Name chess openings in witty mom commentary.
4. LENGTH LIMIT: Keep responses extremely short, punchy, and fast (1 to 2 short sentences max!).
5. If input starts with "HUMAN:", make a witty comment comparing their move to Martin or her kids.
6. If input starts with "MARTINA:" or "STOCKFISH:", explain her move while multitasking (e.g. checking dinner, managing kids).`;

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
