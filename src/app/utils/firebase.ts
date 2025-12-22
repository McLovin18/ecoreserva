// Shim vacío de Firebase: todo el backend ahora es Node.js + SQL Server.
// Este archivo existe solo para que los imports legacy no rompan el build
// mientras se termina de migrar cada servicio al backend.

export const app: null = null;
export const auth: null = null;
export const db: null = null;
export const storage: null = null;
export const googleProvider: null = null;
export const functions: null = null;

// Stub de compatibilidad: algunos componentes legacy aún podrían importar
// sendEmailVerification desde este módulo. Para no romper el build en Vercel,
// exponemos una función vacía que simplemente resuelve sin hacer nada.
// Toda la lógica real de verificación ahora pasa por el backend (/api/auth).
export async function sendEmailVerification(..._args: any[]): Promise<void> {
	return;
}
