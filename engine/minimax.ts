import { Chess } from "chess.js";
import { evaluate } from "./evaluate";

/**
 * Order moves to improve alpha-beta pruning efficiency.
 * Prioritizes: captures > checks > other moves
 */
function orderMoves(chess: Chess): string[] {
  const moves = chess.moves({ verbose: true });

  const scored = moves.map((m) => {
    let score = 0;
    // Capture bonus (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
    if (m.captured) {
      const victimValues: Record<string, number> = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 100,
      };
      const attackerValues: Record<string, number> = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 100,
      };
      score +=
        10 * (victimValues[m.captured] ?? 0) - (attackerValues[m.piece] ?? 0);
    }
    // Promotion bonus
    if (m.promotion) score += 8;
    return { san: m.san, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((m) => m.san);
}

/**
 * Minimax algorithm with alpha-beta pruning.
 *
 * @param chess       - chess.js instance (mutated in place, undone after)
 * @param depth       - remaining search depth
 * @param alpha       - best score that the maximiser can guarantee
 * @param beta        - best score that the minimiser can guarantee
 * @param isMaximizing - true when it's White's turn
 * @returns the evaluated score for this position
 */
export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): number {
  // Base case: leaf node or game over
  if (depth === 0 || chess.isGameOver()) {
    return evaluate(chess);
  }

  const moves = orderMoves(chess);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Beta cut-off
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return minEval;
  }
}

export type Difficulty = "easy" | "medium" | "hard";

const DEPTH_MAP: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 5,
};

/**
 * Returns the best move string (SAN) for the current position.
 */
export function getBestMove(
  chess: Chess,
  difficulty: Difficulty,
): string | null {
  const moves = chess.moves();
  if (moves.length === 0) return null;

  // Easy: pick a random move
  if (difficulty === "easy") {
    // Bias toward center control: score center squares slightly
    const shuffled = [...moves].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }

  const depth = DEPTH_MAP[difficulty];
  const isMaximizing = chess.turn() === "w";

  let bestMove: string | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  // Get ordered moves for the root position
  const orderedMoves = orderMoves(chess);

  for (const move of orderedMoves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    if (isMaximizing && score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (!isMaximizing && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
