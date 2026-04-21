import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export const generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt mancante" });
    }

    if (!apiKey) {
      return res.status(500).json({
        message: "GEMINI_API_KEY mancante nel file .env",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.status(200).json({
      result: response.text,
    });
  } catch (error) {
    console.error("Errore Gemini:", error);
    res.status(500).json({
      message: "Errore nella chiamata a Gemini",
    });
  }
};
