'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeliveryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al nuevo portal de propietarios (compatibilidad con ruta legacy)
    router.replace('/owner/properties');
  }, [router]);

  return <div>Redirigiendo...</div>;
}
