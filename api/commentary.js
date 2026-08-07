import stockfishHandler from './commentary-stockfish.js';
import fwogHandler from './commentary-fwog.js';
import martinaHandler from './commentary-martina.js';
import turtleHandler from './commentary-turtle.js';
import cooperHandler from './commentary-cooper.js';

export default async function handler(req, res) {
    const bot = req.body?.bot;
    if (bot === 'gween_fwog' || bot === 'fwog') return fwogHandler(req, res);
    if (bot === 'martina') return martinaHandler(req, res);
    if (bot === 'turtle' || bot === 'gween_turtle') return turtleHandler(req, res);
    if (bot === 'cooper' || bot === 'koopa') return cooperHandler(req, res);
    return stockfishHandler(req, res);
}
