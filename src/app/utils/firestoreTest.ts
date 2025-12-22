// Archivo legacy de diagnóstico de Firestore.
// En EcoReserva ya no usamos Firestore, sino un backend
// basado en Node.js + SQL Server. Mantenemos un stub para
// evitar errores si algún código antiguo lo importa.

export interface LegacyFirestoreTestResult {
  ok: boolean;
  message: string;
}

export const testDailyOrdersPermissions = async (): Promise<LegacyFirestoreTestResult> => {
  console.warn(
    'testDailyOrdersPermissions: Firestore ha sido deshabilitado. '
    + 'El backend actual usa SQL Server para las reservas.'
  );

  return {
    ok: false,
    message: 'Diagnóstico de Firestore deshabilitado en EcoReserva.'
  };
};

export const runDailyOrdersTest = async (): Promise<LegacyFirestoreTestResult> => {
  console.warn('runDailyOrdersTest: Firestore ya no está disponible en este proyecto.');
  return testDailyOrdersPermissions();
};
