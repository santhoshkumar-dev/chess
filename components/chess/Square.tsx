"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SquareProps {
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const Square: React.FC<SquareProps> = ({
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  isCheck,
  onClick,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center cursor-pointer transition-colors duration-200",
        isLight ? "bg-[#ebecd0]" : "bg-[#779556]",
        isSelected && "bg-[#f6f669]",
        isLastMove && (isLight ? "bg-[#f9f982]" : "bg-[#f5f561]"),
        isCheck && "bg-red-500/80 shadow-[inset_0_0_15px_rgba(255,0,0,0.5)]"
      )}
    >
      {/* Move indicators */}
      {isValidMove && !children && (
        <div className="absolute w-1/4 h-1/4 rounded-full bg-black/10" />
      )}
      {isValidMove && children && (
        <div className="absolute w-[90%] h-[90%] rounded-full border-4 border-black/10" />
      )}
      
      {children}
    </div>
  );
};

export default Square;
