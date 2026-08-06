import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Google Cloud Vertex AI Configuration
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || '927480480621';
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';

app.post('/api/commentary', async (req, res) => {
    const { history, apiKey } = req.body;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const aiOptions = {
            vertexAI: true,
            project: GCP_PROJECT_ID,
            location: GCP_LOCATION,
        };
        
        // Pass API key if provided by user or environment
        const keyToUse = apiKey || process.env.GCP_API_KEY;
        if (keyToUse) {
            aiOptions.apiKey = keyToUse;
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

        for await (const chunk of response) {
            if (chunk.text) {
                res.write(chunk.text);
            }
        }
        res.end();
    } catch (error) {
        console.error('Vertex AI Error:', error);
        res.write(`ERROR: ${error.message}`);
        res.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n♟️  ChessBot Server running at http://localhost:${PORT}`);
    console.log(`Connected to Google Cloud Vertex AI (Project: ${GCP_PROJECT_ID}, Location: ${GCP_LOCATION})\n`);
});
