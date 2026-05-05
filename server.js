import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import groqRoutes from "./routes/groqRoutes.js";
import utentiRoute from "./routes/utentiRoute.js";
import authRoutes from "./routes/authRoutes.js";
import savedQuestsRoute from "./routes/savedQuestsRoute.js";
import { connect } from "./Db.js";

const app = express();
const PORT = 3000;
const groqLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Troppo richieste, riprova tra 1 minuto" },
});

app.use(cors());
app.use(express.json());
app.use("/api/groq", groqLimiter, groqRoutes);
app.use("/api/utenti", utentiRoute);
app.use("/api/auth", authRoutes);
app.use("/api/saved-quests", savedQuestsRoute);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server attivo" });
});

async function startServer() {
  try {
    await connect();
    app.listen(PORT, () => {
      console.log(`Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Impossibile avviare il server senza connessione al DB", err);
    process.exit(1);
  }
}

startServer();
