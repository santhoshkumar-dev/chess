"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useChessEngine } from "@/utils/useChessEngine";
import { useSound } from "@/utils/useSound";
import ChessBoard from "@/components/chess/ChessBoard";
import GameControls from "@/components/chess/GameControls";
import GameInfo from "@/components/chess/GameInfo";
import PromotionDialog from "@/components/chess/PromotionDialog";
import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Sun, 
  Globe, 
  Settings2,
  Volume2,
  VolumeX
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function Home() {
  const { gameStatus, initGame, moveHistory } = useGameStore();
  const { theme, setTheme } = useTheme();
  const { playSound, toggleSound, isSoundEnabled } = useSound();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize AI engine
  useChessEngine();

  // Initialize game on first load IF no moves exist and game is idle
  useEffect(() => {
    if (moveHistory.length === 0 && gameStatus === "idle") {
      initGame();
    }
  }, [initGame, moveHistory.length, gameStatus]);

  // Handle game status notifications and sounds
  useEffect(() => {
    if (gameStatus === "checkmate") {
      toast.error("Checkmate!", {
        description: "Game over. Well played!",
        duration: 5000,
      });
      playSound("gameEnd");
    } else if (gameStatus === "draw" || gameStatus === "stalemate") {
      toast.info("Game Over", {
        description: `It's a ${gameStatus}.`,
      });
      playSound("gameEnd");
    } else if (gameStatus === "check") {
      playSound("check");
    }
  }, [gameStatus, playSound]);

  // Play move sounds
  useEffect(() => {
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      if (lastMove.captured) {
        playSound("capture");
      } else if (lastMove.san.includes("+")) {
        // Skip, handled by check status
      } else {
        playSound("move");
      }
    }
  }, [moveHistory, playSound]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 dark:bg-[#161512] transition-colors duration-500">
      {/* Header */}
      <header className="w-full max-w-7xl px-4 py-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
            <Settings2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight dark:text-zinc-100">MODERN CHESS</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next.js Engine 2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSound()}
            className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            {isSoundEnabled() ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            {mounted ? (
              theme === "dark" ? <Sun className="w-5 h-5 transition-all" /> : <Moon className="w-5 h-5 transition-all" />
            ) : (
              <div className="w-5 h-5" /> // Placeholder to prevent mismatch
            )}
          </Button>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <Globe className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Game Content */}
      <div className="w-full max-w-7xl px-4 flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-8 pb-12">
        {/* Left: Board Area */}
        <div className="flex flex-col items-center justify-center relative">
          <ChessBoard />
          <PromotionDialog />
        </div>

        {/* Right: Controls Area */}
        <div className="flex flex-col gap-6">
          <GameInfo />
          <GameControls />
        </div>
      </div>
    </main>
  );
}
