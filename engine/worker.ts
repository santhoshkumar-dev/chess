/**
 * Chess Engine Web Worker
 * Runs the minimax AI computation in a separate thread to avoid blocking the UI.
 *
 * Message format (incoming): { fen: string; difficulty: 'easy' | 'medium' | 'hard' }
 * Message format (outgoing): { move: string | null; error?: string }
 */

import { Chess } from "chess.js";
import { getBestMove, type Difficulty } from "./minimax";

self.onmessage = (
  event: MessageEvent<{ fen: string; difficulty: Difficulty }>,
) => {
  const { fen, difficulty } = event.data;

  try {
    const chess = new Chess(fen);

    if (chess.isGameOver()) {
      self.postMessage({ move: null });
      return;
    }

    const move = getBestMove(chess, difficulty);
    self.postMessage({ move });
  } catch (error) {
    self.postMessage({ move: null, error: String(error) });
  }
};

export {}; // Required for TypeScript to treat this as a module
