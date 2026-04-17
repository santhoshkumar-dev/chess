"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import Piece from "./Piece";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const pieces = [
  { type: "q", label: "Queen" },
  { type: "r", label: "Rook" },
  { type: "b", label: "Bishop" },
  { type: "n", label: "Knight" },
];

const PromotionDialog: React.FC = () => {
  const { pendingPromotion, currentTurn, makeMove, cancelPromotion } = useGameStore();

  const handlePromotion = (pieceType: string) => {
    if (pendingPromotion) {
      makeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    }
  };

  return (
    <Dialog 
      open={!!pendingPromotion} 
      onOpenChange={(open) => !open && cancelPromotion()}
    >
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Pawn Promotion</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose a piece to promote your pawn to.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 py-8">
          {pieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => handlePromotion(piece.type)}
              className="group relative flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-200"
            >
              <div className="w-16 h-16 group-hover:scale-110 transition-transform duration-200">
                <Piece type={piece.type} color={currentTurn} />
              </div>
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                {piece.label}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;
