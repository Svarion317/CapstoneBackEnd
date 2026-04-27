import mongoose from "mongoose";

export async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("database connesso");
  } catch (err) {
    console.error("errore della connessione Db", err);
    throw err;
  }
}
