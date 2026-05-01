import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UtentiModel from "../models/UtentiModel.js";

function sanitizeUser(userDoc) {
  const user = userDoc.toObject();
  delete user.password;
  return user;
}

function signToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET non configurato");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export async function register(req, res) {
  try {
    const { name, surname, email, birthDate, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email e password sono obbligatori",
      });
    }

    const existingUser = await UtentiModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email già registrata",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UtentiModel.create({
      name,
      surname,
      email,
      birthDate,
      password: hashedPassword,
    });

    const token = signToken(newUser._id);

    return res.status(201).json({
      message: "Registrazione completata",
      token,
      utente: sanitizeUser(newUser),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email e password sono obbligatori",
      });
    }

    const user = await UtentiModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Credenziali non valide",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenziali non valide",
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      message: "Login effettuato",
      token,
      utente: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
