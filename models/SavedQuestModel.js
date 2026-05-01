import mongoose from "mongoose";

const SavedQuestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utenti",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    questText: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const SavedQuestModel = mongoose.model("SavedQuest", SavedQuestSchema);

export default SavedQuestModel;
