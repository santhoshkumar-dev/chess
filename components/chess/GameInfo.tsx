"use client";

import React, { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import {
  formatTime,
  formatMoveNumber,
  getPieceUnicode,
  getMaterialAdvantage,
  getPieceIconPath,
} from "@/utils/chessUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Target, Users } from "lucide-react";

interface TimerDisplayProps {
  time: number;
  isActive: boolean;
  color: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  time,
  isActive,
  color,
}) => (
  <div
    className={`p-4 rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-300 ${
      isActive
        ? color === "w"
          ? "bg-white text-zinc-950 border-primary shadow-lg ring-2 ring-primary/20 scale-105"
          : "bg-zinc-900 text-white border-primary shadow-lg ring-2 ring-primary/20 scale-105"
        : color === "w"
          ? "bg-zinc-100 text-zinc-400 border-zinc-200 shadow-sm"
          : "bg-zinc-800 text-zinc-500 border-zinc-700 shadow-sm"
    }`}
  >
    <span className="text-sm font-bold uppercase tracking-widest mb-1">
      {color === "w" ? "White" : "Black"}
    </span>
    <span className="text-3xl font-mono font-bold">{formatTime(time)}</span>
  </div>
);

const GameInfo: React.FC = () => {
  const {
    moveHistory,
    currentTurn,
    gameStatus,
    timer,
    capturedPieces,
    tickTimer,
  } = useGameStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isActive && gameStatus !== "idle") {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isActive, gameStatus, tickTimer]);

  // Auto-scroll move history
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [moveHistory]);

  const advantage = getMaterialAdvantage(capturedPieces.w, capturedPieces.b);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Timers */}
      <div className="grid grid-cols-2 gap-4">
        <TimerDisplay
          time={timer.whiteTime}
          isActive={
            currentTurn === "w" && timer.isActive && gameStatus === "playing"
          }
          color="w"
        />
        <TimerDisplay
          time={timer.blackTime}
          isActive={
            currentTurn === "b" && timer.isActive && gameStatus === "playing"
          }
          color="b"
        />
      </div>

      <Card className="flex-1 bg-card/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Game History
            </div>
            {gameStatus !== "playing" && gameStatus !== "idle" && (
              <Badge variant="destructive" className="animate-bounce">
                {gameStatus.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[400px]">
          {/* Status Bar - Fixed Height */}
          <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5" />
              TURN:{" "}
              <span
                className={
                  currentTurn === "w"
                    ? "text-zinc-600 dark:text-zinc-400"
                    : "text-primary"
                }
              >
                {currentTurn === "w" ? "WHITE" : "BLACK"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              ADV:{" "}
              <span
                className={advantage >= 0 ? "text-green-600" : "text-red-600"}
              >
                {advantage > 0
                  ? `+${advantage}`
                  : advantage < 0
                    ? advantage
                    : "Even"}
              </span>
            </div>
          </div>

          {/* Captured Pieces Area - Fixed Height */}
          <div className="h-20 px-4 py-3 flex flex-col gap-2 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
            <div className="flex flex-wrap gap-0.5 h-6 overflow-hidden">
              {capturedPieces.w.map((p, i) => (
                <img
                  key={i}
                  src={getPieceIconPath(p, "b")}
                  alt={`Captured Black ${p}`}
                  className="w-6 h-6 grayscale hover:grayscale-0 transition-all cursor-default"
                  title={p}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-0.5 h-6 overflow-hidden">
              {capturedPieces.b.map((p, i) => (
                <img
                  key={i}
                  src={getPieceIconPath(p, "w")}
                  alt={`Captured White ${p}`}
                  className="w-6 h-6 grayscale hover:grayscale-0 transition-all cursor-default"
                  title={p}
                />
              ))}
            </div>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 px-4 py-2">
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {moveHistory.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-muted-foreground text-sm italic">
                  Game waiting to start...
                </div>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map(
                  (_, i) => (
                    <React.Fragment key={i}>
                      <div className="flex gap-3 py-1 items-center border-b border-zinc-100/50 dark:border-zinc-800/50">
                        <span className="text-zinc-400 font-mono text-[10px] w-4">
                          {i + 1}.
                        </span>
                        <span className="font-medium text-sm">
                          {moveHistory[i * 2]?.san}
                        </span>
                      </div>
                      {moveHistory[i * 2 + 1] && (
                        <div className="flex gap-3 py-1 items-center border-b border-zinc-100/50 dark:border-zinc-800/50">
                          <span className="text-zinc-400 font-mono text-[10px] w-4"></span>
                          <span className="font-medium text-sm">
                            {moveHistory[i * 2 + 1]?.san}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ),
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameInfo;
