"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RotateCcw, 
  ChevronLeft, 
  FlipHorizontal,
  Settings,
  Trophy
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const GameControls: React.FC = () => {
  const {
    gameMode,
    difficulty,
    isAIThinking,
    gameStatus,
    setGameMode,
    setDifficulty,
    undoMove,
    initGame,
    flipBoard,
  } = useGameStore();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="w-full h-[400px] bg-card/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 animate-pulse" />
    );
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3 px-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Game Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 pb-4">
        {/* Game Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Game Mode
          </label>
          <Tabs
            value={gameMode}
            onValueChange={(v) => setGameMode(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="pvp">Local PvP</TabsTrigger>
              <TabsTrigger value="ai" className="flex gap-2">
                <Trophy className="w-3.5 h-3.5" />
                vs AI
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* AI Settings & Status Area - Fixed height to avoid shift */}
        <div className="min-h-[100px] flex flex-col justify-start gap-4">
          {gameMode === "ai" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Difficulty
              </label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as any)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (Random)</SelectItem>
                  <SelectItem value="medium">Medium (MiniMax D3)</SelectItem>
                  <SelectItem value="hard">Hard (MiniMax D5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isAIThinking && (
            <div className="text-center text-sm font-medium animate-pulse text-primary pt-1">
              AI is thinking...
            </div>
          )}
        </div>

        {/* Game Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={undoMove}
            disabled={isAIThinking || gameStatus === "idle"}
            className="flex gap-2 h-10 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Undo
          </Button>
          <Button
            variant="outline"
            onClick={flipBoard}
            className="flex gap-2 h-10 font-medium"
          >
            <FlipHorizontal className="w-4 h-4" />
            Flip
          </Button>
          <Button
            variant="destructive"
            onClick={initGame}
            className="col-span-2 flex gap-2 h-11 font-bold mt-2 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            New Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameControls;
