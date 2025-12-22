// Shim vacío de Firebase: todo el backend ahora es Node.js + SQL Server.
// Este archivo existe solo para que los imports legacy no rompan el build
// mientras se termina de migrar cada servicio al backend.

export const app: null = null;
export const auth: null = null;
export const db: null = null;
export const storage: null = null;
export const googleProvider: null = null;
export const functions: null = null;
