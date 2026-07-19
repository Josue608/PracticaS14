require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuarios");

const app = express();
const PORT = process.env.PORT || 4000;
const frontendPath = path.join(__dirname, "..", "frontend");

connectDB();

const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5500",
  "null",
]);

const isLocalhostOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isLocalhostOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static(frontendPath));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secreto_sesion_desarrollo",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Practica 6 API",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting",
  });
});

app.get("/api", (req, res) => {
  res.json({ mensaje: "API Practica 6 funcionando correctamente" });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ mensaje: "Ruta de API no encontrada" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((error, req, res, next) => {
  if (error.message && error.message.includes("CORS")) {
    return res.status(403).json({ mensaje: error.message });
  }
  return next(error);
});

const server = app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${PORT} ya esta en uso. Cierra la otra terminal del servidor o ejecuta:`);
    console.error(`Get-NetTCPConnection -LocalPort ${PORT} | Select-Object OwningProcess`);
    console.error("Stop-Process -Id <PID> -Force");
    process.exit(1);
  }

  throw error;
});
