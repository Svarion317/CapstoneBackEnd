import mongoose from "mongoose";
import SavedQuestModel from "../models/SavedQuestModel.js";

function getAuthenticatedUserId(req) {
  return req.user?.userId;
}

export async function createSavedQuest(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { title, prompt, questText, metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    if (!prompt || !questText) {
      return res.status(400).json({ message: "prompt e questText sono obbligatori" });
    }

    const savedQuest = await SavedQuestModel.create({
      userId,
      title,
      prompt,
      questText,
      metadata,
    });

    return res.status(201).json(savedQuest);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMySavedQuests(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const savedQuests = await SavedQuestModel.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(savedQuests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getSavedQuestById(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    const savedQuest = await SavedQuestModel.findOne({ _id: id, userId });

    if (!savedQuest) {
      return res.status(404).json({ message: "Quest non trovata" });
    }

    return res.status(200).json(savedQuest);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function deleteSavedQuest(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    const deletedQuest = await SavedQuestModel.findOneAndDelete({ _id: id, userId });

    if (!deletedQuest) {
      return res.status(404).json({ message: "Quest non trovata" });
    }

    return res.status(200).json({ message: "Quest eliminata con successo" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
