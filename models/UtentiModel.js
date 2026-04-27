import mongoose from "mongoose";

const UtentiSchema = new mongoose.Schema({
  name: String,
  surname: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  birthDate: String,
  avatar: String,
  password: String,
});

const UtentiModel = mongoose.model("Utenti", UtentiSchema);

export default UtentiModel;
