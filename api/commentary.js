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

        const aiOptions = {};

        if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
            let serviceAccount;
            try {
                serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
            } catch (err) {
                console.error("Error parsing GCP_SERVICE_ACCOUNT_KEY JSON:", err);
            }

            if (serviceAccount) {
                aiOptions.vertexai = true;
                aiOptions.vertexAI = true;
                aiOptions.project = serviceAccount.project_id || process.env.GCP_PROJECT_ID || 'gen-lang-client-0056706521';
                aiOptions.location = process.env.GCP_LOCATION || 'us-central1';
                aiOptions.googleAuthOptions = { credentials: serviceAccount };
            }
        }

        // Fallback to API Key if Service Account is not set
        if (!aiOptions.vertexai) {
            const keyToUse = apiKey || process.env.GCP_API_KEY;
            if (keyToUse) {
                aiOptions.apiKey = keyToUse;
            } else {
                return res.status(400).send('ERROR: Missing GCP_SERVICE_ACCOUNT_KEY in Vercel Environment Variables. Please add GCP_SERVICE_ACCOUNT_KEY in Vercel Settings and Redeploy.');
            }
        }

        const ai = new GoogleGenAI(aiOptions);
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            config: {
                temperature: 0.7,
                thinkingConfig: {
                    thinkingBudget: 0
                },
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
        console.error('Vertex AI Error:', error);
        res.status(500).send(`ERROR: ${error.message}`);
    }
}
