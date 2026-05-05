import express from "express";
import { generateContent } from "../controllers/groqController.js";
import authentication from "../middleware/authentication.js";

const router = express.Router();

router.post("/generate", authentication, generateContent);

export default router;
