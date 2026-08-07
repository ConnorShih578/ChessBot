// Comprehensive Human Chess Opening Book
// Ensures bots play 100% realistic human openings (1.e4, 1.d4, Sicilian, Ruy Lopez, Queen's Gambit, etc.)

const OPENING_BOOK = {
    // Starting position (Move 1 - White)
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": [
        { move: "e4", weight: 55 },
        { move: "d4", weight: 35 },
        { move: "Nf3", weight: 6 },
        { move: "c4", weight: 4 }
    ],

    // 1. e4 responses (Move 1 - Black)
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq": [
        { move: "e5", weight: 45 },
        { move: "c5", weight: 35 }, // Sicilian
        { move: "e6", weight: 12 }, // French
        { move: "c6", weight: 8 }   // Caro-Kann
    ],

    // 1. d4 responses (Move 1 - Black)
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq": [
        { move: "d5", weight: 50 },
        { move: "Nf6", weight: 40 }, // Indian Defenses
        { move: "e6", weight: 10 }
    ],

    // 1. e4 e5 -> 2. Nf3
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq": [
        { move: "Nf3", weight: 85 },
        { move: "Bc4", weight: 10 },
        { move: "Nc3", weight: 5 }
    ],

    // 1. e4 e5 2. Nf3 -> Nc6
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq": [
        { move: "Nc6", weight: 85 },
        { move: "Nf6", weight: 15 } // Petrov
    ],

    // 1. e4 e5 2. Nf3 Nc6 -> 3. Bb5 (Ruy Lopez) / 3. Bc4 (Italian) / 3. d4 (Scotch)
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq": [
        { move: "Bb5", weight: 50 }, // Ruy Lopez
        { move: "Bc4", weight: 35 }, // Italian Game
        { move: "d4", weight: 15 }   // Scotch Game
    ],

    // 1. e4 c5 (Sicilian) -> 2. Nf3
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq": [
        { move: "Nf3", weight: 80 },
        { move: "Nc3", weight: 20 }
    ],

    // 1. e4 c5 2. Nf3 d6 -> 3. d4
    "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq": [
        { move: "d4", weight: 90 },
        { move: "Bb5+", weight: 10 }
    ],

    // 1. d4 d5 -> 2. c4 (Queen's Gambit)
    "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq": [
        { move: "c4", weight: 85 },
        { move: "Nf3", weight: 15 }
    ],

    // 1. d4 d5 2. c4 -> e6 (QGD) / c6 (Slav) / dxc4 (QGA)
    "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq": [
        { move: "e6", weight: 50 },
        { move: "c6", weight: 35 },
        { move: "dxc4", weight: 15 }
    ]
};

if (typeof window !== 'undefined') {
    window.getOpeningBookMove = function(game) {
        const fen = game.fen();
        for (const key in OPENING_BOOK) {
            if (fen.startsWith(key)) {
                const candidates = OPENING_BOOK[key];
                const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
                let rand = Math.random() * totalWeight;
                for (const c of candidates) {
                    if (rand < c.weight) return c.move;
                    rand -= c.weight;
                }
                return candidates[0].move;
            }
        }
        return null;
    };
}
