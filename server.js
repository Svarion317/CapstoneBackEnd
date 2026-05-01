import "dotenv/config";
import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/geminiRoutes.js";
import utentiRoute from "./routes/utentiRoute.js";
import authRoutes from "./routes/authRoutes.js";
import { connect } from "./Db.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/gemini", geminiRoutes);
app.use("/api/utenti", utentiRoute);
app.use("/api/auth", authRoutes);

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
