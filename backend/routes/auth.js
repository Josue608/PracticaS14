const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Usuario = require("../models/Usuario");

const router = express.Router();

const generarToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Falta JWT_SECRET en el archivo .env");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

const usuarioPublico = (usuario) => ({
  _id: usuario._id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  token: generarToken(usuario._id),
});

const getFrontendUrl = (req) => {
  const configuredUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");

  if (configuredUrl && configuredUrl !== "http://localhost:3000") {
    return configuredUrl;
  }

  return `${req.protocol}://${req.get("host")}`;
};

router.post("/registro", async (req, res) => {
  try {
    const nombre = (req.body.nombre || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    if (password.length < 6) {
      return res.status(400).json({ mensaje: "El password debe tener al menos 6 caracteres" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ mensaje: "Ya existe un usuario con ese email" });
    }

    const usuario = await Usuario.create({ nombre, email, password });
    return res.status(201).json(usuarioPublico(usuario));
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al registrar usuario", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ mensaje: "Email y password son obligatorios" });
    }

    const usuario = await Usuario.findOne({ email }).select("+password");

    if (!usuario || !usuario.password) {
      return res.status(401).json({ mensaje: "Credenciales invalidas" });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: "Credenciales invalidas" });
    }

    return res.json(usuarioPublico(usuario));
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al iniciar sesion", error: error.message });
  }
});

router.get(
  "/google",
  (req, res, next) => {
    if (!passport.googleOAuthConfigured) {
      return res.status(503).json({
        mensaje: "Google OAuth no esta configurado en el backend",
      });
    }
    return next();
  },
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!passport.googleOAuthConfigured) {
      return res.redirect(`${getFrontendUrl(req)}/index.html`);
    }
    return next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/login-fallido",
  }),
  (req, res) => {
    const usuario = req.user;
    const token = generarToken(usuario._id);
    const frontendUrl = getFrontendUrl(req);

    return res.redirect(`${frontendUrl}/oauth-exito.html?token=${encodeURIComponent(token)}`);
  }
);

router.get("/login-fallido", (req, res) => {
  res.status(401).json({ mensaje: "No se pudo iniciar sesion con Google" });
});

module.exports = router;
