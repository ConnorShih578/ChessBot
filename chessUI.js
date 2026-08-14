// Chess UI & Visual Enhancements (Legal moves, Eval bar, Captured pieces, Move history, Promotion modal, Bot reactions)

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_SYMBOLS_WHITE = { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' };
const PIECE_SYMBOLS_BLACK = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

const BOT_EXPRESSIONS = {
    timmy: { normal: '👨‍💻', winning: '😎', losing: '😵‍💫', check: '☕', mate: '🏆' },
    antigravity: { normal: '🚀', winning: '⚡', losing: '🛰️', check: '🛸', mate: '👾' },
    chicken: { normal: '🐔', winning: '🦅', losing: '🍗', check: '🥚', mate: '👑' },
    cooper: { normal: '🐢👑', winning: '😈', losing: '🤕', check: '💥', mate: '🔥' },
    turtle: { normal: '🐢', winning: '🥗', losing: '🪵', check: '🍃', mate: '🏅' },
    martina: { normal: '👧', winning: '💅', losing: '🤔', check: '🧐', mate: '👑' },
    fwog: { normal: '🐸', winning: '👅', losing: '🥴', check: '🌧️', mate: '🌟' },
    default: { normal: '🤖', winning: '😎', losing: '😰', check: '🤯', mate: '👑' }
};

/**
 * Show legal move indicators on valid target squares
 */
export function showLegalMoveDots(game, sourceSquare) {
    clearLegalMoveDots();
    if (!game || !sourceSquare) return;

    const moves = game.moves({ square: sourceSquare, verbose: true });
    moves.forEach(m => {
        const targetSquareEl = document.querySelector(`.square-${m.to}`);
        if (!targetSquareEl) return;

        const isCapture = !!m.captured;
        const hintEl = document.createElement('div');
        hintEl.className = isCapture ? 'legal-move-capture' : 'legal-move-dot';
        targetSquareEl.appendChild(hintEl);
    });
}

/**
 * Clear all legal move dots
 */
export function clearLegalMoveDots() {
    document.querySelectorAll('.legal-move-dot, .legal-move-capture').forEach(el => el.remove());
}

/**
 * Calculate & update captured pieces and material count
 */
export function updateCapturedPieces(game, elements = {}) {
    const defaultWhitePieces = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const defaultBlackPieces = { p: 8, n: 2, b: 2, r: 2, q: 1 };

    const board = game.board();
    const currentWhite = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const currentBlack = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                if (piece.color === 'w' && piece.type !== 'k') {
                    currentWhite[piece.type]++;
                } else if (piece.color === 'b' && piece.type !== 'k') {
                    currentBlack[piece.type]++;
                }
            }
        }
    }

    let whiteScore = 0;
    let blackScore = 0;
    let whiteCapturedHTML = '';
    let blackCapturedHTML = '';

    // Captured by Black (White pieces lost)
    for (const [type, count] of Object.entries(defaultWhitePieces)) {
        const lost = Math.max(0, count - (currentWhite[type] || 0));
        for (let i = 0; i < lost; i++) {
            whiteCapturedHTML += `<span class="cap-piece">${PIECE_SYMBOLS_WHITE[type]}</span>`;
            blackScore += PIECE_VALUES[type];
        }
    }

    // Captured by White (Black pieces lost)
    for (const [type, count] of Object.entries(defaultBlackPieces)) {
        const lost = Math.max(0, count - (currentBlack[type] || 0));
        for (let i = 0; i < lost; i++) {
            blackCapturedHTML += `<span class="cap-piece">${PIECE_SYMBOLS_BLACK[type]}</span>`;
            whiteScore += PIECE_VALUES[type];
        }
    }

    const whiteAdvantage = whiteScore - blackScore;

    if (elements.whiteContainer) {
        elements.whiteContainer.innerHTML = whiteCapturedHTML + (whiteAdvantage > 0 ? ` <span class="mat-diff">+${whiteAdvantage}</span>` : '');
    }
    if (elements.blackContainer) {
        elements.blackContainer.innerHTML = blackCapturedHTML + (whiteAdvantage < 0 ? ` <span class="mat-diff">+${-whiteAdvantage}</span>` : '');
    }

    return { whiteScore, blackScore, whiteAdvantage };
}

/**
 * Update Move History (PGN list)
 */
export function updateMoveHistoryUI(game, historyContainer) {
    if (!historyContainer) return;
    const history = game.history();
    let html = '';

    for (let i = 0; i < history.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = history[i] || '';
        const blackMove = history[i + 1] || '';
        html += `<div class="move-entry"><span class="m-num">${moveNum}.</span><span class="m-white">${whiteMove}</span><span class="m-black">${blackMove}</span></div>`;
    }

    historyContainer.innerHTML = html || '<div style="color: #666; font-style: italic; font-size: 0.8rem;">No moves played yet</div>';
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

/**
 * Update Engine Eval Bar
 */
export function updateEvalBarUI(evalValue, isMate = false, playerColor = 'w') {
    const evalFill = document.getElementById('eval-bar-fill');
    const evalText = document.getElementById('eval-bar-text');
    if (!evalFill || !evalText) return;

    let displayScore = "";
    let whitePercentage = 50;

    if (isMate) {
        displayScore = `M${Math.abs(evalValue)}`;
        whitePercentage = evalValue > 0 ? 100 : 0;
    } else {
        const score = typeof evalValue === 'number' ? evalValue : parseFloat(evalValue) || 0;
        displayScore = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
        if (score === 0) displayScore = "0.0";

        // Sigmoid mapping for chess eval
        whitePercentage = 50 + 50 * (2 / (1 + Math.exp(-0.4 * score)) - 1);
        whitePercentage = Math.max(5, Math.min(95, whitePercentage));
    }

    evalFill.style.height = `${whitePercentage}%`;
    evalText.innerText = displayScore;
}

/**
 * Update Dynamic Bot Reaction / Avatar
 */
export function updateBotReactionUI(botKey, currentAdvantage, isCheck, isGameOver) {
    const avatarEl = document.querySelector('.avatar');
    if (!avatarEl) return;

    const emojis = BOT_EXPRESSIONS[botKey] || BOT_EXPRESSIONS.default;

    if (isGameOver) {
        avatarEl.innerText = emojis.mate;
    } else if (isCheck) {
        avatarEl.innerText = emojis.check;
    } else if (currentAdvantage > 2) {
        avatarEl.innerText = emojis.winning;
    } else if (currentAdvantage < -2) {
        avatarEl.innerText = emojis.losing;
    } else {
        avatarEl.innerText = emojis.normal;
    }
}

/**
 * Pawn Promotion Modal
 */
export function promptPawnPromotion(color, onPieceSelected) {
    const modalId = 'pawn-promo-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'promotion-modal-backdrop';
        document.body.appendChild(modal);
    }

    const pieces = color === 'w'
        ? [{ key: 'q', sym: '♕', name: 'Queen' }, { key: 'r', sym: '♖', name: 'Rook' }, { key: 'b', sym: '♗', name: 'Bishop' }, { key: 'n', sym: '♘', name: 'Knight' }]
        : [{ key: 'q', sym: '♛', name: 'Queen' }, { key: 'r', sym: '♜', name: 'Rook' }, { key: 'b', sym: '♝', name: 'Bishop' }, { key: 'n', sym: '♞', name: 'Knight' }];

    modal.innerHTML = `
        <div class="promotion-modal-box">
            <h3>Choose Promotion Piece</h3>
            <div class="promo-pieces-grid">
                ${pieces.map(p => `<button class="promo-btn" data-piece="${p.key}"><span class="promo-sym">${p.sym}</span><span class="promo-name">${p.name}</span></button>`).join('')}
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    modal.querySelectorAll('.promo-btn').forEach(btn => {
        btn.onclick = () => {
            const piece = btn.getAttribute('data-piece');
            modal.style.display = 'none';
            if (onPieceSelected) onPieceSelected(piece);
        };
    });
}

// Global attachment
if (typeof window !== 'undefined') {
    window.chessUI = {
        showLegalMoveDots,
        clearLegalMoveDots,
        updateCapturedPieces,
        updateMoveHistoryUI,
        updateEvalBarUI,
        updateBotReactionUI,
        promptPawnPromotion
    };
}
