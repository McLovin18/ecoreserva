// Utilidades legacy relacionadas con Firebase Auth.
// EcoReserva usa autenticación basada en JWT con backend Node.js,
// por lo que estas funciones quedan como stubs seguros.

export const refreshAuthToken = async (): Promise<boolean> => {
  console.warn(
    'refreshAuthToken: Firebase Auth ha sido deshabilitado. '
    + 'Usa el flujo de login basado en JWT del backend.'
  );
  return false;
};

export const checkAuthStatus = (): void => {
  console.warn(
    'checkAuthStatus: ya no se usa Firebase Auth. '
    + 'Revisa el estado de autenticación mediante AuthContext/JWT.'
  );
};
