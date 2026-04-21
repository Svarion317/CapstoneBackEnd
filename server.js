import "dotenv/config";
import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/geminiRoutes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/gemini", geminiRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server attivo" });
});

app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
