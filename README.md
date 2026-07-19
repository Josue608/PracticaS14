# Practica 6 - CRUD + JWT + OAuth Google

Aplicacion de practica para administrar usuarios con Node.js, Express, MongoDB, JWT y Google OAuth. El backend tambien sirve el frontend estatico, asi que en local puedes usar una sola URL.

## Estructura

```text
backend/
  config/
  middleware/
  models/
  routes/
  .env.example
  package.json
  server.js
frontend/
  index.html
  app.js
  oauth-exito.html
```

## Requisitos

- Node.js 18 o superior.
- MongoDB Atlas o MongoDB local.
- Credenciales OAuth de Google para el login con Google.

## Ejecutar en local

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Despues abre:

```text
http://localhost:4000
```

La API queda disponible en:

```text
http://localhost:4000/api
```

## Variables de entorno

Usa `backend/.env.example` como guia:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/practica6
JWT_SECRET=cambia_esta_clave_por_una_cadena_larga_y_segura
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
SESSION_SECRET=cambia_esta_clave_de_sesion
FRONTEND_URL=http://localhost:4000
```

## Endpoints principales

- `POST /api/auth/registro`: crea cuenta y devuelve JWT.
- `POST /api/auth/login`: inicia sesion y devuelve JWT.
- `GET /api/auth/google`: inicia OAuth con Google.
- `GET /api/health`: revisa estado del servicio.
- `GET /api/usuarios`: lista usuarios protegidos por JWT.
- `POST /api/usuarios`: crea usuario protegido por JWT.
- `PUT /api/usuarios/:id`: actualiza usuario protegido por JWT.
- `DELETE /api/usuarios/:id`: elimina usuario protegido por JWT.

## Notas para Google OAuth

En Google Cloud Console registra esta URL como redirect autorizado para local:

```text
http://localhost:4000/api/auth/google/callback
```

En produccion, cambia `GOOGLE_CALLBACK_URL` y `FRONTEND_URL` por las URLs reales del backend y frontend.

## Seguridad

No subas `backend/.env` a GitHub. Si una clave real se compartio por accidente, cambia esa credencial en MongoDB Atlas o Google Cloud Console antes de entregar o publicar el proyecto.
