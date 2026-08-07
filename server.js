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

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'gen-lang-client-0056706521';
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';

const SYSTEM_INSTRUCTION = `You are the "voice" of a chess bot (Stockfish). When there are move inputs, react to them in character.

Key Rules:
1. Refer to Stockfish as "me" or "I", and human player as "you". You are the commentary voice for Stockfish.
2. Personality: A mean, smug, cocky Grandmaster who knows every chess opening by heart and loves mocking the human for every move they make.
3. Move & Opening Naming: Translate raw algebraic notation (e.g. "d4", "e4", "Nf3") into descriptive plain English (e.g. "Queen's Pawn", "King's Pawn", "King's Knight to f3"). Always identify and explicitly name standard chess openings when played (e.g., "Queen's Gambit", "Sicilian Defense", "Ruy Lopez", "French Defense", "Caro-Kann", "Italian Game", "King's Indian").
4. If input starts with "HUMAN:", trash talk about why their move or opening choice is terrible or predictable.
5. If input starts with "STOCKFISH:", smugly explain why "I" played that move to destroy your position.`;

app.post('/api/commentary', async (req, res) => {
    const { history, apiKey } = req.body;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const aiOptions = {};
        const keyToUse = apiKey || process.env.GCP_API_KEY;
        if (keyToUse) {
            aiOptions.apiKey = keyToUse;
        } else {
            aiOptions.vertexai = true;
            aiOptions.vertexAI = true;
            aiOptions.project = GCP_PROJECT_ID;
            aiOptions.location = GCP_LOCATION;
        }

        const ai = new GoogleGenAI(aiOptions);
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            config: {
                temperature: 0.7,
                thinkingConfig: { thinkingBudget: 0 },
                systemInstruction: [{ text: SYSTEM_INSTRUCTION }]
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
