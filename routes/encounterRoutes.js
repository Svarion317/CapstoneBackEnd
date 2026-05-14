import express from "express";
import { randomEncounterController } from "../controllers/encounterController.js";
import authentication from "../middleware/authentication.js";

const router = express.Router();

router.post("/random", authentication, randomEncounterController);

export default router;
