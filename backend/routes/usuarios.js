const express = require("express");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const { protegerRuta } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protegerRuta);

const validarId = (id, res) => {
  if (mongoose.isValidObjectId(id)) return true;
  res.status(400).json({ mensaje: "ID de usuario invalido" });
  return false;
};

router.post("/", async (req, res) => {
  try {
    const nombre = (req.body.nombre || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const rol = req.body.rol || "usuario";

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Nombre, email y password son obligatorios" });
    }

    if (password.length < 6) {
      return res.status(400).json({ mensaje: "El password debe tener al menos 6 caracteres" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ mensaje: "Ya existe un usuario con ese email" });
    }

    const nuevoUsuario = await Usuario.create({ nombre, email, password, rol });

    return res.status(201).json({
      _id: nuevoUsuario._id,
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      createdAt: nuevoUsuario.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al crear usuario", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const filtro = {};
    if (req.query.nombre) filtro.nombre = new RegExp(req.query.nombre, "i");
    if (req.query.email) filtro.email = new RegExp(req.query.email, "i");

    const usuarios = await Usuario.find(filtro).sort({ createdAt: -1 });
    return res.json({ total: usuarios.length, usuarios });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!validarId(req.params.id, res)) return;

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    return res.json(usuario);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener usuario", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!validarId(req.params.id, res)) return;

    const nombre = (req.body.nombre || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const rol = req.body.rol;

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (email && email !== usuario.email) {
      const existe = await Usuario.findOne({ email, _id: { $ne: usuario._id } });
      if (existe) {
        return res.status(400).json({ mensaje: "Ya existe un usuario con ese email" });
      }
      usuario.email = email;
    }

    if (nombre) usuario.nombre = nombre;
    if (rol) usuario.rol = rol;

    const actualizado = await usuario.save();
    return res.json(actualizado);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al actualizar usuario", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!validarId(req.params.id, res)) return;

    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    return res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message });
  }
});

module.exports = router;
