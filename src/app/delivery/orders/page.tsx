"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ruta legacy de delivery: en EcoReserva redirigimos al panel de reservas del anfitrión
export default function LegacyDeliveryOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/owner/reservations");
  }, [router]);

  return <div>Redirigiendo...</div>;
}
