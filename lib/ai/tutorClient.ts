/**
 * Client for communicating with the local LLM (llama-server)
 * for Chess Coaching feedback.
 */

const LOCAL_LLM_URL = "http://localhost:8080/v1/chat/completions";

const SYSTEM_PROMPT = `You are a World-Class Chess Grandmaster Coach and mentor. 
Your goal is to help the player improve by analyzing their moves in real-time.

CONTEXT:
- Board state is provided in FEN format.
- Moves are in SAN (Standard Algebraic Notation).
- Evaluation is in centipawns (100 = 1 pawn advantage).

GUIDELINES:
1. BE CONCISE: Players are in the middle of a game. Give 1-3 sentences of punchy, tactical advice.
2. EXPLAIN THE "WHY": If a move is a mistake, don't just say so. Explain the tactical or positional reason (e.g., "This leaves your King's side airy," or "You missed a chance to pin the Knight").
3. BE ENCOURAGING: Use a friendly, professional tone. act like a supportive mentor.
4. CHESS LOGIC: Prioritize center control, piece activity, king safety, and development in your explanations.
5. FORMATTING: Use bold text for key terms or moves.

When the move is a MISTAKE (large negative eval change): 
Explain what the player missed and what they should have considered instead.

When the move is GOOD (positive or neutral eval change):
Briefly explain the benefit or offer a small hint for the next phase.`;

export async function getCoachFeedback(
  fen: string,
  lastMove: string,
  moveHistory: string[],
  prevEval: number,
  currEval: number,
  playerColor: "w" | "b",
  engineSuggestion?: string | null
) {
  const evalChange = currEval - prevEval;
  const isMistake = playerColor === "w" ? evalChange < -150 : evalChange > 150;
  const isGreat = playerColor === "w" ? evalChange > 100 : evalChange < -100;

  // Build the message for the LLM
  const userMessage = `
Current FEN: ${fen}
Last Move Made: ${lastMove}
Player's Color: ${playerColor === "w" ? "White" : "Black"}
Evaluation Change: ${evalChange.toFixed(0)} centipawns (Positive = White better, Negative = Black better)
Position Evaluation Score: ${currEval.toFixed(0)}
${engineSuggestion ? `Engine's Suggested Best Move: ${engineSuggestion}` : ""}

Task: Provide a short (max 2-3 sentences) coach analysis. 
${isMistake ? "Identify why the last move was a blunder and why the suggested move is better." : "Explain why the move was good or suggest the next steps based on the engine's suggestion."}
`;

  try {
    const response = await fetch(LOCAL_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "ignored",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Coach API Error:", error);
    return "I'm having trouble analyzing that move right now. My local brain might be offline!";
  }
}
