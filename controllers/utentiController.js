import UtentiModel from "../models/UtentiModel.js";

function removePassword(userDoc) {
  const userResponse = userDoc.toObject();
  delete userResponse.password;
  return userResponse;
}

export async function create(req, res) {
  try {
    const { name, surname, email, birthDate, avatar, password } = req.body;
    const utente = new UtentiModel({
      name,
      surname,
      email,
      birthDate,
      avatar,
      password,
    });

    const nuovoUtente = await utente.save();
    res.status(201).json(removePassword(nuovoUtente));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
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
    const { name, surname, email, birthDate, avatar, password } = req.body;

    const utenteAggiornato = await UtentiModel.findByIdAndUpdate(
      id,
      {
        name,
        surname,
        email,
        birthDate,
        avatar,
        password,
      },
      { new: true, runValidators: true }
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
