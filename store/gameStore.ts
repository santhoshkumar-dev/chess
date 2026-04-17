import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chess } from "chess.js";
import type { Square, Move } from "chess.js";

export type GameMode = "pvp" | "ai";
export type Difficulty = "easy" | "medium" | "hard";
export type GameStatus =
  | "idle"
  | "playing"
  | "check"
  | "checkmate"
  | "draw"
  | "stalemate";
export type PlayerColor = "w" | "b";

export interface CapturedPieces {
  w: string[]; // pieces captured by white
  b: string[]; // pieces captured by black
}

export interface TimerState {
  whiteTime: number; // seconds remaining
  blackTime: number;
  isActive: boolean;
  initialTime: number; // in seconds
}

interface GameState {
  // Core game state
  fen: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  playerColor: PlayerColor; // which color human plays when vs AI
  isFlipped: boolean;

  // UI state
  selectedSquare: Square | null;
  validMoveSquares: Square[];
  lastMove: { from: Square; to: Square } | null;

  // Game status
  gameStatus: GameStatus;
  currentTurn: PlayerColor;
  moveHistory: Move[];
  capturedPieces: CapturedPieces;

  // AI state
  isAIThinking: boolean;

  // AI Coach state
  coachMessages: Array<{ role: "user" | "assistant"; content: string }>;
  isCoachThinking: boolean;

  // Promotion state
  pendingPromotion: { from: Square; to: Square } | null;

  // Timer
  timer: TimerState;

  // Actions
  initGame: () => void;
  selectSquare: (square: Square) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  undoMove: () => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setPlayerColor: (color: PlayerColor) => void;
  flipBoard: () => void;
  setAIThinking: (thinking: boolean) => void;
  setCoachThinking: (thinking: boolean) => void;
  addCoachMessage: (role: "user" | "assistant", content: string) => void;
  clearCoachMessages: () => void;
  cancelPromotion: () => void;
  startGame: () => void;
  tickTimer: () => void;
  setTimerActive: (active: boolean) => void;
  resetTimer: () => void;
  setTimerDuration: (seconds: number) => void;
}

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const DEFAULT_TIMER = 600; // 10 minutes

function getGameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return "checkmate";
  if (chess.isStalemate()) return "stalemate";
  if (chess.isDraw()) return "draw";
  if (chess.inCheck()) return "check";
  return "playing";
}

function getCapturedPieces(moveHistory: Move[]): CapturedPieces {
  const captured: CapturedPieces = { w: [], b: [] };
  for (const move of moveHistory) {
    if (move.captured) {
      // The capturing side is move.color; they captured opponent's piece
      // Store the captured piece type under the capturing player's key
      const capturer = move.color;
      captured[capturer].push(move.captured);
    }
  }
  return captured;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      fen: DEFAULT_FEN,
      gameMode: "pvp",
      difficulty: "medium",
      playerColor: "w",
      isFlipped: false,
      selectedSquare: null,
      validMoveSquares: [],
      lastMove: null,
      gameStatus: "idle",
      currentTurn: "w",
      moveHistory: [],
      capturedPieces: { w: [], b: [] },
      coachMessages: [
        {
          role: "assistant",
          content: "Hello! I'm your AI Chess Coach. I'll help you analyze your moves in real-time. Good luck!",
        },
      ],
      isCoachThinking: false,
      isAIThinking: false,
      pendingPromotion: null,
      timer: {
        whiteTime: DEFAULT_TIMER,
        blackTime: DEFAULT_TIMER,
        isActive: false,
        initialTime: DEFAULT_TIMER,
      },

      initGame: () => {
        set({
          fen: DEFAULT_FEN,
          selectedSquare: null,
          validMoveSquares: [],
          lastMove: null,
          gameStatus: "idle",
          currentTurn: "w",
          moveHistory: [],
          capturedPieces: { w: [], b: [] },
          isAIThinking: false,
          isCoachThinking: false,
          coachMessages: [
            {
              role: "assistant",
              content: "Game reset. I'm ready to analyze your new game!",
            },
          ],
          pendingPromotion: null,
          timer: {
            whiteTime: get().timer.initialTime,
            blackTime: get().timer.initialTime,
            isActive: false,
            initialTime: get().timer.initialTime,
          },
        });
      },

      startGame: () => {
        set((s) => ({
          gameStatus: "playing",
          timer: { ...s.timer, isActive: true },
        }));
      },

      selectSquare: (square: Square) => {
        const {
          fen,
          selectedSquare,
          gameStatus,
          currentTurn,
          gameMode,
          playerColor,
          isAIThinking,
        } = get();

        if (
          gameStatus === "idle" ||
          gameStatus === "checkmate" ||
          gameStatus === "draw" ||
          gameStatus === "stalemate"
        )
          return;
        if (isAIThinking) return;

        // In AI mode, only allow moves on human's turn
        if (gameMode === "ai" && currentTurn !== playerColor) return;

        const chess = new Chess(fen);
        const piece = chess.get(square);

        // If a square is already selected
        if (selectedSquare) {
          const validMoves = get().validMoveSquares;

          // Clicked a valid destination
          if (validMoves.includes(square)) {
            // Check for pawn promotion
            const movingPiece = chess.get(selectedSquare);
            const isPromotion =
              movingPiece?.type === "p" &&
              ((movingPiece.color === "w" && square[1] === "8") ||
                (movingPiece.color === "b" && square[1] === "1"));

            if (isPromotion) {
              set({ pendingPromotion: { from: selectedSquare, to: square } });
              return;
            }

            get().makeMove(selectedSquare, square);
            return;
          }

          // Clicked another own piece - reselect
          if (piece && piece.color === currentTurn) {
            const moves = chess.moves({ square, verbose: true });
            set({
              selectedSquare: square,
              validMoveSquares: moves.map((m) => m.to as Square),
            });
            return;
          }

          // Clicked empty or opponent - deselect
          set({ selectedSquare: null, validMoveSquares: [] });
          return;
        }

        // No square selected yet - select if own piece
        if (piece && piece.color === currentTurn) {
          const moves = chess.moves({ square, verbose: true });
          set({
            selectedSquare: square,
            validMoveSquares: moves.map((m) => m.to as Square),
          });
        }
      },

      makeMove: (from: Square, to: Square, promotion?: string) => {
        const { fen, moveHistory } = get();
        const chess = new Chess(fen);

        try {
          const moveResult = chess.move({
            from,
            to,
            promotion: promotion ?? "q",
          });

          if (!moveResult) return false;

          const updatedHistory = [...moveHistory, moveResult];
          const newFen = chess.fen();
          const newStatus = getGameStatus(chess);
          const capturedPieces = getCapturedPieces(updatedHistory);

          set({
            fen: newFen,
            currentTurn: chess.turn() as PlayerColor,
            moveHistory: updatedHistory,
            capturedPieces,
            gameStatus: newStatus,
            selectedSquare: null,
            validMoveSquares: [],
            lastMove: { from, to },
            pendingPromotion: null,
          });

          // Stop timer if game over
          if (["checkmate", "stalemate", "draw"].includes(newStatus)) {
            set((s) => ({ timer: { ...s.timer, isActive: false } }));
          }

          return true;
        } catch {
          return false;
        }
      },

      undoMove: () => {
        const { gameMode, moveHistory, isAIThinking } = get();
        if (isAIThinking || moveHistory.length === 0) return;

        // In AI mode, undo two moves (human + AI)
        const undoCount = gameMode === "ai" ? 2 : 1;
        const updatedHistory = [...moveHistory];
        for (let i = 0; i < undoCount; i++) {
          if (updatedHistory.length > 0) {
            updatedHistory.pop();
          }
        }

        // Re-construct game state from history
        const chess = new Chess();
        for (const move of updatedHistory) {
          chess.move(move);
        }

        const lastHistoryMove = updatedHistory[updatedHistory.length - 1];

        set({
          fen: chess.fen(),
          currentTurn: chess.turn() as PlayerColor,
          moveHistory: updatedHistory,
          capturedPieces: getCapturedPieces(updatedHistory),
          gameStatus: getGameStatus(chess),
          selectedSquare: null,
          validMoveSquares: [],
          lastMove: lastHistoryMove
            ? {
                from: lastHistoryMove.from as Square,
                to: lastHistoryMove.to as Square,
              }
            : null,
          isAIThinking: false,
        });
      },

      setGameMode: (mode) => set({ gameMode: mode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setPlayerColor: (color) => set({ playerColor: color }),
      flipBoard: () => set((s) => ({ isFlipped: !s.isFlipped })),
      setAIThinking: (thinking) => set({ isAIThinking: thinking }),
      setCoachThinking: (thinking) => set({ isCoachThinking: thinking }),
      addCoachMessage: (role, content) =>
        set((s) => ({
          coachMessages: [...s.coachMessages, { role, content }],
        })),
      clearCoachMessages: () =>
        set({
          coachMessages: [
            {
              role: "assistant",
              content: "Chat cleared. I'm still watching your game!",
            },
          ],
        }),
      cancelPromotion: () =>
        set({
          pendingPromotion: null,
          selectedSquare: null,
          validMoveSquares: [],
        }),

      tickTimer: () => {
        const { currentTurn, gameStatus, timer } = get();
        if (!timer.isActive || gameStatus === "idle") return;

        if (currentTurn === "w") {
          if (timer.whiteTime <= 0) {
            set((s) => ({
              gameStatus: "checkmate", // White ran out of time
              timer: { ...s.timer, isActive: false, whiteTime: 0 },
            }));
          } else {
            set((s) => ({
              timer: { ...s.timer, whiteTime: s.timer.whiteTime - 1 },
            }));
          }
        } else {
          if (timer.blackTime <= 0) {
            set((s) => ({
              gameStatus: "checkmate", // Black ran out of time
              timer: { ...s.timer, isActive: false, blackTime: 0 },
            }));
          } else {
            set((s) => ({
              timer: { ...s.timer, blackTime: s.timer.blackTime - 1 },
            }));
          }
        }
      },

      setTimerActive: (active) =>
        set((s) => ({ timer: { ...s.timer, isActive: active } })),

      resetTimer: () =>
        set((s) => ({
          timer: {
            ...s.timer,
            whiteTime: s.timer.initialTime,
            blackTime: s.timer.initialTime,
            isActive: false,
          },
        })),

      setTimerDuration: (seconds) =>
        set((s) => ({
          timer: {
            ...s.timer,
            initialTime: seconds,
            whiteTime: seconds,
            blackTime: seconds,
          },
        })),
    }),
    {
      name: "chess-game-storage",
      partialize: (state) => ({
        fen: state.fen,
        gameMode: state.gameMode,
        difficulty: state.difficulty,
        playerColor: state.playerColor,
        isFlipped: state.isFlipped,
        moveHistory: state.moveHistory,
        currentTurn: state.currentTurn,
        gameStatus: state.gameStatus,
        timer: state.timer,
        coachMessages: state.coachMessages,
      }),
    },
  ),
);
