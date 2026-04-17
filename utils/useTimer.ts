"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

export function useTimer() {
  const { timer, gameStatus, tickTimer } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (
      (timer.isActive && gameStatus === "playing") ||
      gameStatus === "check"
    ) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isActive, gameStatus, tickTimer]);
}
