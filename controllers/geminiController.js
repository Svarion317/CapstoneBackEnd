import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export const generateContent = async (req, res) => {
  try {
    const {
      players,
      level,
      classes,
      missionType,
      tone,
      generateNpc,
      includeTwist,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!players || !level || !missionType || !tone) {
      return res.status(400).json({
        message: "Missing required quest fields",
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        message: "GEMINI_API_KEY mancante nel file .env",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const selectedClasses = Array.isArray(classes)
      ? classes.filter(Boolean).join(", ")
      : "None specified";

    const prompt = `
Create a Dungeons & Dragons quest with these details:

- Number of players: ${players}
- Average party level: ${level}
- Party classes: ${selectedClasses}
- Mission type: ${missionType}
- Tone: ${tone}
- Generate NPCs: ${generateNpc ? "yes" : "no"}
- Include a narrative twist: ${includeTwist ? "yes" : "no"}

Return:
1. Quest title
2. Short introduction
3. Main objective
4. Main obstacle or enemy
5. Reward
${generateNpc ? "6. Include at least one important NPC" : ""}
${includeTwist ? "7. Add a narrative twist" : ""}

Write in English with a fantasy tone.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.status(200).json({
      result: response.text,
    });
  } catch (error) {
    console.error("Errore Gemini:", error);

    const errorMessage = typeof error?.message === "string" ? error.message : "";
    const isInvalidOrExpiredKey =
      errorMessage.includes("API key expired") ||
      errorMessage.includes("API_KEY_INVALID");

    if (isInvalidOrExpiredKey) {
      return res.status(401).json({
        message: "GEMINI_API_KEY non valida o scaduta. Rigenera la chiave e aggiorna il file .env.",
      });
    }

    res.status(500).json({
      message: "Errore nella chiamata a Gemini",
    });
  }
};
