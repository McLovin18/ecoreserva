"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ruta legacy de "Mis Compras" del antiguo e‑commerce.
// EcoReserva ahora se centra solo en reservas de hospedajes.
const LegacyMyOrdersRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/myReservations");
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="text-center p-4">
        <h2 className="fw-bold mb-2">Historial de compras legacy deshabilitado</h2>
        <p className="text-muted mb-0">
          Ahora puedes revisar tus reservas activas y pasadas en la vista
          <strong> Mis reservas</strong>. Redirigiendo...
        </p>
      </div>
    </div>
  );
};

export default LegacyMyOrdersRedirect;