"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ruta legacy del antiguo panel de pedidos/delivery.
// En EcoReserva todo se gestiona ahora como reservas de hospedaje.
// Esta página solo redirige al nuevo panel de reservas de administración.
export default function LegacyAdminOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/reservations");
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="text-center p-4">
        <h2 className="fw-bold mb-2">Panel de pedidos legacy deshabilitado</h2>
        <p className="text-muted mb-0">
          Ahora todas las gestiones se realizan en el panel de reservas de hospedajes.
          Redirigiendo al nuevo panel de administración...
        </p>
      </div>
    </div>
  );
}
