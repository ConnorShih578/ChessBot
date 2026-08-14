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

import stockfishHandler from './api/commentary-stockfish.js';
import fwogHandler from './api/commentary-fwog.js';
import martinaHandler from './api/commentary-martina.js';
import turtleHandler from './api/commentary-turtle.js';
import cooperHandler from './api/commentary-cooper.js';
import timmyHandler from './api/commentary-timmy.js';
import antigravityHandler from './api/commentary-antigravity.js';
import chickenHandler from './api/commentary-chicken.js';

app.post('/api/commentary-stockfish', (req, res) => stockfishHandler(req, res));
app.post('/api/commentary-fwog', (req, res) => fwogHandler(req, res));
app.post('/api/commentary-martina', (req, res) => martinaHandler(req, res));
app.post('/api/commentary-turtle', (req, res) => turtleHandler(req, res));
app.post('/api/commentary-cooper', (req, res) => cooperHandler(req, res));
app.post('/api/commentary-timmy', (req, res) => timmyHandler(req, res));
app.post('/api/commentary-antigravity', (req, res) => antigravityHandler(req, res));
app.post('/api/commentary-chicken', (req, res) => chickenHandler(req, res));
app.post('/api/commentary', (req, res) => stockfishHandler(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n♟️  ChessBot Server running at http://localhost:${PORT}\n`);
});
