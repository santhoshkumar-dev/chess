"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { Chess } from "chess.js";
import { evaluate } from "@/engine/evaluate";
import { getBestMove } from "@/engine/minimax";
import { getCoachFeedback } from "@/lib/ai/tutorClient";

/**
 * Hook to manage AI Coaching logic.
 * Triggers analysis on every player move.
 */
export function useAITutor() {
  const {
    fen,
    moveHistory,
    currentTurn,
    playerColor,
    gameMode,
    isCoachThinking,
    setCoachThinking,
    addCoachMessage,
  } = useGameStore();

  const prevFenRef = useRef<string>(fen);
  const prevEvalRef = useRef<number>(0);

  useEffect(() => {
    // Only analyze after a move is made
    if (fen === prevFenRef.current) return;

    const lastMove = moveHistory[moveHistory.length - 1];
    if (!lastMove) return;

    // Only provide coaching for the human player's moves
    // in AI mode or for both in PvP mode?
    // Let's analyze the move THAT WAS JUST MADE.
    // If it was white's move, we analyze White's move.
    // The currentTurn will have flipped already.
    // companion logic: analyze every move.
    const movedColor = lastMove.color; // 'w' or 'b'
    
    // In AI mode, if the Move that was just made was the AI player's move,
    // the coach should explain what it did.
    // If it was the human's move, the coach should analyze the human's move.

    const analyzeMove = async () => {
      setCoachThinking(true);

      try {
        const chess = new Chess(fen);
        const currentEval = evaluate(chess);
        const previousEval = prevEvalRef.current;
        
        // Use Minimax engine to find the 'best' move for the position 
        // that existed BEFORE the current move was made, to see if the player missed it.
        // Or find the best move for the CURRENT position to suggest next steps.
        const bestMove = getBestMove(chess, "medium"); // use medium for balanced suggestions
        
        const feedback = await getCoachFeedback(
          fen,
          lastMove.san,
          moveHistory.map(m => m.san),
          previousEval,
          currentEval,
          movedColor as "w" | "b",
          bestMove
        );

        addCoachMessage("assistant", feedback);
        
        // Update refs for next turn
        prevEvalRef.current = currentEval;
      } catch (err) {
        console.error("AI Tutor Analysis Error:", err);
      } finally {
        setCoachThinking(false);
      }
    };

    analyzeMove();
    prevFenRef.current = fen;
    
  }, [fen, moveHistory, gameMode, playerColor, addCoachMessage, setCoachThinking]);

  // Initial evaluation for the starting position
  useEffect(() => {
     if (moveHistory.length === 0) {
         const chess = new Chess(fen);
         prevEvalRef.current = evaluate(chess);
     }
  }, [fen, moveHistory.length]);
}
