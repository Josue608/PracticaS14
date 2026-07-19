const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const protegerRuta = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "No autorizado, no se proporciono token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select("-password");

    if (!usuario) {
      return res.status(401).json({ mensaje: "Usuario no encontrado, token invalido" });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    console.error("Error verificando token:", error.message);
    return res.status(401).json({ mensaje: "No autorizado, token invalido o expirado" });
  }
};

module.exports = { protegerRuta };
