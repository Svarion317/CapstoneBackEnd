import express from "express";
import authentication from "../middleware/authentication.js";
import {
  createSavedQuest,
  getMySavedQuests,
  getSavedQuestById,
  deleteSavedQuest,
} from "../controllers/savedQuestsController.js";

const savedQuestsRouter = express.Router();

savedQuestsRouter.use(authentication);
savedQuestsRouter.post("/", createSavedQuest);
savedQuestsRouter.get("/", getMySavedQuests);
savedQuestsRouter.get("/:id", getSavedQuestById);
savedQuestsRouter.delete("/:id", deleteSavedQuest);

export default savedQuestsRouter;
