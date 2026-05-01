import jwt from "jsonwebtoken";

export default function authentication(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token mancante" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedPayload;
    return next();
  } catch {
    return res.status(401).json({ message: "Token non valido" });
  }
}
