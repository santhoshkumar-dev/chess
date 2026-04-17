import { Chess } from "chess.js";

// Piece values in centipawns
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// ===== PIECE-SQUARE TABLES =====
// Indexed from a8 (index 0) to h1 (index 63)
// White uses table as-is; Black uses vertically mirrored table

const PAWN_TABLE = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0, // rank 8 (promotion)
  50,
  50,
  50,
  50,
  50,
  50,
  50,
  50, // rank 7
  10,
  10,
  20,
  30,
  30,
  20,
  10,
  10, // rank 6
  5,
  5,
  10,
  25,
  25,
  10,
  5,
  5, // rank 5
  0,
  0,
  0,
  20,
  20,
  0,
  0,
  0, // rank 4
  5,
  -5,
  -10,
  0,
  0,
  -10,
  -5,
  5, // rank 3
  5,
  10,
  10,
  -20,
  -20,
  10,
  10,
  5, // rank 2 (start)
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0, // rank 1
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
  0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20,
  15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0,
  -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10,
  -10, -10, -10, -10, -10, -20,
];

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5,
  5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10,
  -20,
];

// King safety during middle game
const KING_MIDDLE_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
  -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
  -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20,
  -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
];

// King endgame - encourage centralization
const KING_END_TABLE = [
  -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30,
  -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30,
  0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

const PST_MAP: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_MIDDLE_TABLE,
};

/**
 * Returns the PST bonus for a piece at a given board position.
 * row/col: 0-indexed where row=0=rank8, col=0=a-file
 */
function getPSTValue(
  pieceType: string,
  row: number,
  col: number,
  isWhite: boolean,
): number {
  const table = PST_MAP[pieceType] ?? PAWN_TABLE;
  const idx = isWhite ? row * 8 + col : (7 - row) * 8 + col;
  return table[idx] ?? 0;
}

/**
 * Determine if we're in the endgame.
 * Endgame: no queens, or both sides have queen + only one minor piece.
 */
function isEndgame(chess: Chess): boolean {
  const board = chess.board();
  let queens = 0;
  let minors = 0;
  for (const row of board) {
    for (const square of row) {
      if (!square) continue;
      if (square.type === "q") queens++;
      if (square.type === "n" || square.type === "b") minors++;
    }
  }
  return queens === 0 || (queens === 2 && minors <= 2);
}

/**
 * Main evaluation function.
 * Returns a score from White's perspective.
 * Positive = White is better, Negative = Black is better.
 */
export function evaluate(chess: Chess): number {
  // Terminal states
  if (chess.isCheckmate()) {
    // The player whose turn it is is in checkmate (they lose)
    return chess.turn() === "w" ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate()) return 0;

  const endgame = isEndgame(chess);
  let score = 0;

  const board = chess.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const isWhite = piece.color === "w";
      const sign = isWhite ? 1 : -1;
      const pieceType = piece.type;

      // Material value
      score += sign * (PIECE_VALUES[pieceType] ?? 0);

      // PST bonus (use endgame king table if applicable)
      if (pieceType === "k" && endgame) {
        const idx = isWhite ? row * 8 + col : (7 - row) * 8 + col;
        score += sign * (KING_END_TABLE[idx] ?? 0);
      } else {
        score += sign * getPSTValue(pieceType, row, col, isWhite);
      }
    }
  }

  // Mobility bonus: number of legal moves available
  const mobilityBonus = chess.moves().length * 2;
  score += chess.turn() === "w" ? mobilityBonus : -mobilityBonus;

  return score;
}
