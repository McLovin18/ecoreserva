# EcoReserva Backend (Node.js + SQL Server)

Este backend reemplaza el uso de Firestore/Firebase como base de datos por **Microsoft SQL Server**, usando el modelo físico que indicaste (`ReservasHospedajesDB`) y un API REST en Node.js.

## Tecnologías

- Node.js + Express
- Microsoft SQL Server (`mssql`)
- Autenticación con JWT (`jsonwebtoken`)
- Hash de contraseñas con `bcryptjs`

## Estructura

- `src/db.js`: conexión a SQL Server usando las variables de entorno.
- `src/server.js`: arranque del servidor Express y ruta `/api/health`.
- `src/routes/auth.js`: registro y login de usuarios (Administrador, Anfitrión, Turista) basado en las tablas `Usuario` y `Rol`.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta tus datos:

```bash
cd backend
copy .env.example .env
```

Edita `.env` con tu servidor SQL y credenciales.

## Instalar y ejecutar

```bash
cd backend
npm install
npm run dev
```

El backend expone por defecto:

- `GET http://localhost:4000/api/health` → verifica conexión a la BD.
- `POST http://localhost:4000/api/auth/register` → registro (turista/anfitrión).
- `POST http://localhost:4000/api/auth/login` → inicio de sesión con correo y contraseña.
- `GET  http://localhost:4000/api/auth/me` → datos del usuario autenticado (requiere header `Authorization: Bearer <token>`).

## Integración con el frontend actual

En el frontend (Next.js) puedes migrar progresivamente de Firebase a este backend:

- Reemplazar las llamadas de `AuthContext`:
  - `register(email, password, name, role)` → `POST /api/auth/register` con `role = 'owner' | 'client'`.
  - `login(email, password)` → `POST /api/auth/login`, guardar `token` en `localStorage`/cookie segura y leer datos de usuario.
  - `useRole` puede basarse ahora en `user.role` que viene del backend (`admin | owner | client`).

Luego puedes añadir rutas para el resto de funcionalidades (hospedajes, actividades, reservas, pagos, reseñas, reportes) mapeando directamente a las tablas `Hospedaje`, `Actividad`, `Reserva`, `Pago`, `Resena`, etc., siguiendo el mismo patrón que en `auth.js`.
