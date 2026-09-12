// app/api/judge/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { scenario, excuse, playerName } = await req.json();

    if (!excuse || !excuse.trim()) {
      return NextResponse.json(
        { error: "Excuse is required" },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * LOCAL SCORE
     * =========================================================
     *
     * Keeping your existing scoring system.
     */
    const wordCount =
      excuse.trim() === "" ? 0 : excuse.trim().split(/\s+/).length;

    const calculatedScore = Math.min(
      Math.floor(wordCount * 2.5),
      100
    );

    let defaultCritique =
      "Too concise. A toddler could see right through this. Ramble more!";

    if (wordCount > 15) {
      defaultCritique =
        "Not bad, you're introducing unnecessary subplots. Keep stretching it.";
    }

    if (wordCount > 40) {
      defaultCritique =
        "Excellent bureaucracy! Bringing up irrelevant details just to stall is true artistry.";
    }

    /*
     * =========================================================
     * GEMINI AI ANNOUNCER
     * =========================================================
     */

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if Gemini isn't configured.
    if (!apiKey) {
      return NextResponse.json({
        score: calculatedScore,
        critique: `[Local Scorer Mode] ${defaultCritique}`,
        announcer: `${playerName || "Player"} has submitted their excuse! The judges are suspiciously quiet.`,
      });
    }

    const prompt = `
You are the chaotic live announcer of a multiplayer excuse game called "Excuse Royale".

A player has just submitted an excuse.

SCENARIO:
${scenario || "Unknown scenario"}

PLAYER:
${playerName || "Player"}

PLAYER'S EXCUSE:
${excuse}

SCORE:
${calculatedScore}/100

Generate a funny, context-dependent announcer reaction.

IMPORTANT RULES:
- React specifically to THIS scenario and THIS excuse.
- Mention something specific from the excuse whenever possible.
- The comment must feel spontaneous and different from previous comments.
- Be playful, sarcastic and absurd.
- Sound like a live game-show announcer.
- 1 or 2 sentences only.
- Maximum 35 words.
- Do NOT simply repeat the player's excuse.
- Do NOT simply repeat the critique.
- Do NOT say "roast".
- Do NOT mention that you are an AI.
- Do NOT use profanity.
- Do NOT use generic comments like "great excuse" or "nice try" without context.
- The comment should still make sense if read aloud.

Also generate a short critique of the excuse.

Return ONLY valid JSON in exactly this format:

{
  "critique": "short funny critique",
  "announcer": "short live announcer reaction"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 1.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        await response.text()
      );

      return NextResponse.json({
        score: calculatedScore,
        critique: `[Local Scorer Mode] ${defaultCritique}`,
        announcer: `${playerName || "Player"} has entered their excuse into evidence. The courtroom is deeply concerned.`,
      });
    }

    const data = await response.json();

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    let aiResult: {
      critique?: string;
      announcer?: string;
    } = {};

    try {
      aiResult = JSON.parse(generatedText || "{}");
    } catch {
      console.error("Could not parse Gemini response:", generatedText);
    }

    const critique =
      aiResult.critique?.trim() || defaultCritique;

    const announcer =
      aiResult.announcer?.trim() ||
      `${playerName || "Player"} has submitted an excuse so suspicious that even the judges need a moment to process it.`;

    return NextResponse.json({
      score: calculatedScore,
      critique,
      announcer,
    });
  } catch (error) {
    console.error("Judge route error:", error);

    return NextResponse.json(
      {
        error: "Server processing error",
      },
      { status: 500 }
    );
  }
}