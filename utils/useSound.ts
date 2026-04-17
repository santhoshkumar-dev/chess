"use client";

import { useCallback, useRef } from "react";

type SoundType =
  | "move"
  | "capture"
  | "check"
  | "castle"
  | "promote"
  | "gameEnd";

/**
 * Generates chess sound effects using the Web Audio API.
 * No external audio files needed.
 */
export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType = "sine",
      volume = 0.15,
    ) => {
      if (!enabledRef.current) return;
      const ctx = getAudioCtx();
      if (!ctx) return;

      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + duration,
        );

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch {
        // Audio context unavailable
      }
    },
    [getAudioCtx],
  );

  const playSound = useCallback(
    (type: SoundType) => {
      switch (type) {
        case "move":
          // Soft click
          playTone(440, 0.08, "sine", 0.12);
          break;

        case "capture":
          // Stronger thump
          playTone(220, 0.15, "triangle", 0.2);
          setTimeout(() => playTone(180, 0.1, "sine", 0.1), 30);
          break;

        case "check":
          // Alert tone
          playTone(880, 0.1, "sine", 0.18);
          setTimeout(() => playTone(660, 0.15, "sine", 0.12), 100);
          break;

        case "castle":
          // Two-note sequence
          playTone(392, 0.1, "sine", 0.12);
          setTimeout(() => playTone(523, 0.1, "sine", 0.12), 120);
          break;

        case "promote":
          // Ascending arpeggio
          playTone(523, 0.1, "sine", 0.15);
          setTimeout(() => playTone(659, 0.1, "sine", 0.15), 100);
          setTimeout(() => playTone(784, 0.15, "sine", 0.15), 200);
          break;

        case "gameEnd":
          // Descending chime
          playTone(784, 0.2, "sine", 0.2);
          setTimeout(() => playTone(659, 0.2, "sine", 0.15), 200);
          setTimeout(() => playTone(523, 0.3, "sine", 0.15), 400);
          break;
      }
    },
    [playTone],
  );

  const toggleSound = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  }, []);

  const isSoundEnabled = useCallback(() => enabledRef.current, []);

  return { playSound, toggleSound, isSoundEnabled };
}
