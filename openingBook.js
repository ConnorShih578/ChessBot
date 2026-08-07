// Comprehensive Human Chess Opening Book with Character-Specific Opening Preferences
// Koopa: Englund Gambit (1.d4 e5) & King's Pawn Knight (1.e4 e5 2.Nf3)
// Turtle: Conservative Defenses (Caro-Kann 1.e4 c6, French 1.e4 e6, Slav 1.d4 d5 2.c4 c6)
// Gween Fwog: Balanced openings

const OPENING_BOOK = {
    // Starting position (Move 1 - White)
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq": {
        default: [{ move: "e4", weight: 55 }, { move: "d4", weight: 35 }, { move: "Nf3", weight: 6 }, { move: "c4", weight: 4 }],
        cooper: [{ move: "e4", weight: 100 }],
        turtle: [{ move: "e4", weight: 50 }, { move: "d4", weight: 50 }]
    },

    // 1. e4 responses (Move 1 - Black)
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq": {
        default: [{ move: "e5", weight: 45 }, { move: "c5", weight: 35 }, { move: "e6", weight: 12 }, { move: "c6", weight: 8 }],
        cooper: [{ move: "e5", weight: 90 }, { move: "c5", weight: 10 }],
        turtle: [{ move: "c6", weight: 60 }, { move: "e6", weight: 40 }] // Conservative Caro-Kann / French
    },

    // 1. d4 responses (Move 1 - Black)
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq": {
        default: [{ move: "d5", weight: 50 }, { move: "Nf6", weight: 40 }, { move: "e6", weight: 10 }],
        cooper: [{ move: "e5", weight: 100 }], // Englund Gambit!
        turtle: [{ move: "d5", weight: 85 }, { move: "e6", weight: 15 }] // Conservative
    },

    // 1. e4 e5 -> 2. Nf3 (King's Pawn, Knight Variation)
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq": {
        default: [{ move: "Nf3", weight: 85 }, { move: "Bc4", weight: 10 }, { move: "Nc3", weight: 5 }],
        cooper: [{ move: "Nf3", weight: 100 }] // King's Pawn Knight Variation!
    },

    // 1. e4 e5 2. Nf3 -> Nc6 / Nf6
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq": {
        default: [{ move: "Nc6", weight: 85 }, { move: "Nf6", weight: 15 }],
        turtle: [{ move: "Nf6", weight: 60 }, { move: "Nc6", weight: 40 }] // Petrov Defense (conservative)
    },

    // 1. e4 e5 2. Nf3 Nc6 -> 3. Bb5 / 3. Bc4
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq": {
        default: [{ move: "Bb5", weight: 50 }, { move: "Bc4", weight: 35 }, { move: "d4", weight: 15 }],
        cooper: [{ move: "Bc4", weight: 70 }, { move: "Bb5", weight: 30 }]
    },

    // 1. e4 c5 (Sicilian) -> 2. Nf3
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq": {
        default: [{ move: "Nf3", weight: 80 }, { move: "Nc3", weight: 20 }]
    },

    // 1. d4 d5 -> 2. c4 (Queen's Gambit)
    "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq": {
        default: [{ move: "c4", weight: 85 }, { move: "Nf3", weight: 15 }]
    },

    // 1. d4 d5 2. c4 -> e6 / c6 (Slav)
    "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq": {
        default: [{ move: "e6", weight: 50 }, { move: "c6", weight: 35 }, { move: "dxc4", weight: 15 }],
        turtle: [{ move: "c6", weight: 70 }, { move: "e6", weight: 30 }] // Conservative Slav Defense
    }
};

if (typeof window !== 'undefined') {
    window.getOpeningBookMove = function(game, botName = 'default') {
        const fen = game.fen();
        for (const key in OPENING_BOOK) {
            if (fen.startsWith(key)) {
                const bookEntry = OPENING_BOOK[key];
                const candidates = bookEntry[botName] || bookEntry.default;
                if (!candidates || candidates.length === 0) continue;

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
