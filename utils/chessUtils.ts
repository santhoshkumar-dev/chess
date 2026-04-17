import type { Square } from "chess.js";

/**
 * Converts a chess square notation to row/col indices.
 * Returns { row, col } where row 0 = rank 8, col 0 = a-file
 */
export function squareToCoords(square: Square): { row: number; col: number } {
  const col = square.charCodeAt(0) - 97; // 'a' = 0
  const row = 8 - parseInt(square[1]);
  return { row, col };
}

/**
 * Converts row/col to square notation.
 */
export function coordsToSquare(row: number, col: number): Square {
  const file = String.fromCharCode(97 + col);
  const rank = (8 - row).toString();
  return `${file}${rank}` as Square;
}

/**
 * Returns the display color for a square.
 */
export function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

/**
 * Formats seconds to MM:SS display format.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Returns the Unicode chess piece character.
 */
export function getPieceUnicode(type: string, color: string): string {
  const pieces: Record<string, Record<string, string>> = {
    w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
    b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
  };
  return pieces[color]?.[type] ?? "";
}

/**
 * Returns a human-readable piece name.
 */
export function getPieceName(type: string): string {
  const names: Record<string, string> = {
    k: "King",
    q: "Queen",
    r: "Rook",
    b: "Bishop",
    n: "Knight",
    p: "Pawn",
  };
  return names[type] ?? type;
}

/**
 * Formats move number display: "1.", "1...", "2.", etc.
 */
export function formatMoveNumber(index: number): string {
  const num = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${num}.` : `${num}...`;
}

/**
 * Returns point value for a captured piece type.
 */
export function getPieceValue(type: string): number {
  const values: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };
  return values[type] ?? 0;
}

/**
 * Calculates material advantage.
 * Returns positive if white is ahead, negative if black is ahead.
 */
export function getMaterialAdvantage(
  capturedByWhite: string[],
  capturedByBlack: string[],
): number {
  const sumValues = (pieces: string[]) =>
    pieces.reduce((sum, p) => sum + getPieceValue(p), 0);
  return sumValues(capturedByWhite) - sumValues(capturedByBlack);
}
