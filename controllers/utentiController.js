import UtentiModel from "../models/UtentiModel.js";
import bcrypt from "bcrypt";

function removePassword(userDoc) {
  const userResponse = userDoc.toObject();
  delete userResponse.password;
  return userResponse;
}

export async function create(req, res) {
  return res.status(410).json({
    message: "Endpoint dismesso. Usa /api/auth/register",
  });
}

export async function getAll(req, res) {
  try {
    const utenti = await UtentiModel.find({}, "-password");
    res.status(200).json(utenti);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId || authenticatedUserId !== id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const utente = await UtentiModel.findById(id, "-password");

    if (!utente) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    return res.status(200).json(utente);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, surname, email, birthDate, password } = req.body;
    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId || authenticatedUserId !== id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const updateData = { name, surname, email, birthDate };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const utenteAggiornato = await UtentiModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!utenteAggiornato) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    return res.status(200).json(removePassword(utenteAggiornato));
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId || authenticatedUserId !== id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const utenteEliminato = await UtentiModel.findByIdAndDelete(id);

    if (!utenteEliminato) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    return res.status(200).json({
      message: "Utente eliminato con successo",
      utente: removePassword(utenteEliminato),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
