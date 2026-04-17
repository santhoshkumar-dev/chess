"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Square } from "chess.js";
import { getBestMove } from "@/engine/minimax";
import { Chess } from "chess.js";

/**
 * Manages the AI chess engine.
 * Tries to use a Web Worker; falls back to main-thread computation.
 */
export function useChessEngine() {
  const workerRef = useRef<Worker | null>(null);
  const {
    fen,
    gameMode,
    difficulty,
    currentTurn,
    playerColor,
    gameStatus,
    setAIThinking,
    makeMove,
  } = useGameStore();

  // Initialize Web Worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const worker = new Worker(
        new URL("../engine/worker.ts", import.meta.url),
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<{ move: string | null }>) => {
        const { move } = e.data;
        setAIThinking(false);

        if (!move) return;

        // Parse the SAN move to get from/to squares using chess.js
        try {
          const chess = new Chess(useGameStore.getState().fen);
          const moveObj = chess.move(move);
          if (moveObj) {
            chess.undo();
            makeMove(
              moveObj.from as Square,
              moveObj.to as Square,
              moveObj.promotion,
            );
          }
        } catch {
          // Fallback: try direct from/to parsing
        }
      };

      worker.onerror = () => {
        setAIThinking(false);
        workerRef.current = null;
      };

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      // Web Worker not available, will use main-thread fallback
      workerRef.current = null;
    }
  }, []);

  // Main-thread fallback AI computation
  const runMainThreadAI = useCallback(
    (currentFen: string) => {
      // Use setTimeout to yield to the browser and allow UI updates
      setTimeout(() => {
        try {
          const chess = new Chess(currentFen);
          const move = getBestMove(chess, difficulty);
          setAIThinking(false);

          if (!move) return;

          const chess2 = new Chess(currentFen);
          const moveObj = chess2.move(move);
          if (moveObj) {
            makeMove(
              moveObj.from as Square,
              moveObj.to as Square,
              moveObj.promotion,
            );
          }
        } catch {
          setAIThinking(false);
        }
      }, 50); // Small delay to let UI render
    },
    [difficulty, setAIThinking, makeMove],
  );

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (
      gameMode !== "ai" ||
      currentTurn === playerColor ||
      gameStatus === "idle" ||
      gameStatus === "checkmate" ||
      gameStatus === "draw" ||
      gameStatus === "stalemate"
    ) {
      return;
    }

    setAIThinking(true);

    // Add a small delay to make AI "thinking" feel natural
    const delay =
      difficulty === "hard" ? 300 : difficulty === "medium" ? 200 : 100;

    const timeoutId = setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage({ fen, difficulty });
      } else {
        runMainThreadAI(fen);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [
    fen,
    gameMode,
    currentTurn,
    playerColor,
    gameStatus,
    difficulty,
    setAIThinking,
    runMainThreadAI,
  ]);
}
