"use client";

import React, { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import Square from "./Square";
import Piece from "./Piece";
import { Chess, type Square as ChessSquare } from "chess.js";
import { coordsToSquare } from "@/utils/chessUtils";
import { Button } from "@/components/ui/button";
import { Play, Trophy, Users } from "lucide-react";

const ChessBoard: React.FC = () => {
  const {
    fen,
    selectedSquare,
    validMoveSquares,
    lastMove,
    gameStatus,
    gameMode,
    isFlipped,
    selectSquare,
    startGame,
  } = useGameStore();

  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = useMemo(() => {
    const b = chess.board();
    if (isFlipped) {
      return [...b].reverse().map(row => [...row].reverse());
    }
    return b;
  }, [chess, isFlipped]);

  const isInCheck = gameStatus === "check" || gameStatus === "checkmate";
  const kingSquare = useMemo(() => {
    if (!isInCheck) return null;
    const turn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = chess.get(coordsToSquare(r, c));
        if (piece?.type === "k" && piece.color === turn) {
          return coordsToSquare(r, c);
        }
      }
    }
    return null;
  }, [chess, isInCheck]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus === "idle") return;
    // Correct for flipped board
    const actualRow = isFlipped ? 7 - row : row;
    const actualCol = isFlipped ? 7 - col : col;
    const square = coordsToSquare(actualRow, actualCol);
    selectSquare(square);
  };

  return (
    <div className="relative aspect-square w-full max-w-[600px] border-4 border-[#312e2b] shadow-2xl rounded overflow-hidden group">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {board.map((row, rIdx) =>
          row.map((piece, cIdx) => {
            // Calculate actual square name based on loop index and flip state
            const actualRow = isFlipped ? 7 - rIdx : rIdx;
            const actualCol = isFlipped ? 7 - cIdx : cIdx;
            const squareName = coordsToSquare(actualRow, actualCol);

            return (
              <Square
                key={squareName}
                isLight={(actualRow + actualCol) % 2 === 0}
                isSelected={selectedSquare === squareName}
                isValidMove={validMoveSquares.includes(squareName as ChessSquare)}
                isLastMove={
                  lastMove?.from === squareName || lastMove?.to === squareName
                }
                isCheck={kingSquare === squareName}
                onClick={() => handleSquareClick(rIdx, cIdx)}
              >
                {piece && (
                  <Piece
                    type={piece.type}
                    color={piece.color}
                    className="w-[85%] h-[85%]"
                  />
                )}
              </Square>
            );
          })
        )}
      </div>

      {/* Start Game Overlay */}
      {gameStatus === "idle" && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-6 max-w-[320px] scale-in-center overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {gameMode === "ai" ? <Trophy className="w-8 h-8 text-primary" /> : <Users className="w-8 h-8 text-primary" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight uppercase">Ready to Play?</h3>
              <p className="text-sm text-muted-foreground font-medium">
                {gameMode === "ai" ? "vs Computer" : "vs Friend"}
              </p>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 flex gap-3 group"
              onClick={startGame}
            >
              <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              START GAME
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
