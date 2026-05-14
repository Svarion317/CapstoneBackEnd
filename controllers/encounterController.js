import { generateRandomEncounter } from "../services/encounterService.js";

const VALID_DIFFICULTIES = ["easy", "medium", "hard", "deadly"];

function validateRandomEncounterInput(players, level, difficulty) {
  if (!Number.isInteger(players) || players < 1 || players > 8) {
    return "Invalid input: players must be an integer between 1 and 8.";
  }

  if (!Number.isInteger(level) || level < 1 || level > 20) {
    return "Invalid input: level must be an integer between 1 and 20.";
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return "Invalid input: difficulty must be one of easy, medium, hard, deadly.";
  }

  return null;
}

export async function randomEncounterController(req, res) {
  try {
    const { players, level, difficulty } = req.body;
    const validationError = validateRandomEncounterInput(players, level, difficulty);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const encounter = await generateRandomEncounter({ players, level, difficulty });

    return res.status(200).json(encounter);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Unable to generate random encounter.",
    });
  }
}
