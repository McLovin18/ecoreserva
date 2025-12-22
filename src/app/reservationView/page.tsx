"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ruta legacy del antiguo flujo de carrito/checkout.
// En EcoReserva las reservas se crean desde los hospedajes y paneles de reservas.
const LegacyReservationViewRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="text-center p-4">
        <h2 className="fw-bold mb-2">Flujo de compra legacy deshabilitado</h2>
        <p className="text-muted mb-0">
          El antiguo carrito de productos y entrega a domicilio ya no está
          disponible. Para reservar hospedajes, utiliza la página principal y tus
          vistas de reservas.
        </p>
      </div>
    </div>
  );
};

export default LegacyReservationViewRedirect;
