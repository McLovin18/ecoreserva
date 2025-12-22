# Adaptación a sistema de reservas de departamentos

Este proyecto de tienda se ha extendido para soportar reservas de departamentos de hotel con tres roles:

- **Administrador**: gestiona inventario, aprueba reservas y controla publicaciones de departamentos.
- **Dueño de departamentos (owner)**: crea departamentos (inventario) y ve/gestiona reservas de sus propiedades.
- **Cliente**: navega propiedades disponibles, crea reservas y puede ver el historial de sus reservas.

## Cambios principales

- **Roles y contexto**
  - `src/app/context/AuthContext.tsx`: se amplía `UserData` con `role: 'owner'` y banderas `owner`, `ownedPropertyIds`.
  - `src/app/context/adminContext.tsx`: añade el rol `owner` en `UserRole`, detecta propietarios en la colección `propertyOwners` y en `users`, y expone `isOwner`.

- **Inventario como departamentos**
  - `src/app/services/inventoryService.ts`:
    - Amplía `ProductInventory` con `ownerEmail` y `status: 'pending' | 'approved' | 'rejected'`.
    - `createOrUpdateProduct` guarda `status` (por defecto `pending`).
    - `getAvailableProducts` y `getProductsByCategory` solo devuelven elementos con stock y no rechazados (y, si hay estatus, solo aprobados).
    - Nuevas utilidades: `getProductsByOwner(ownerEmail)` y `getProductById(productId)` y `updateProductStatus(...)`.

- **Propietario (dueño de departamentos)**
  - Nueva sección owner:
    - `src/app/owner/properties/page.tsx`: panel "Mis departamentos" para que el dueño cree departamentos (nombre, precio/noche, stock/unidades, categoría, descripción). Todo se guarda en `inventory` con `ownerEmail` y `status: 'pending'`.
    - `src/app/owner/reservations/page.tsx`: muestra reservas asociadas a sus propiedades y permite avanzar estado (`checked_in`, `checked_out`, `completed`).

- **Reservas**
  - `src/app/services/reservationService.ts`:
    - Define modelo `Reservation` y `ReservationStatus`.
    - `createReservation(...)`: valida disponibilidad vía `inventoryService.isProductAvailable`, reduce stock y guarda en colección `reservations` con estado inicial `pending_admin`.
    - `updateReservationStatus(...)`: cambia el estado y, si se cancela/rechaza, devuelve una unidad al inventario.
    - `getReservationsForOwner`, `getReservationsForUser`, `getAllReservations` para paneles de dueño, cliente y admin.
  - Cliente:
    - `src/app/products/[id]/page.tsx`:
      - Importa `reservationService` y usa `inventoryService.getProductById` para obtener `ownerEmail`.
      - Reemplaza el botón principal por **“Reservar departamento”** que crea una reserva (por ahora, fechas simples: hoy a mañana, 1 huésped) y muestra alerta de éxito.
  - Cliente – historial:
    - `src/app/myReservations/page.tsx`: lista todas las reservas del usuario con estados y fechas.

- **Administrador**
  - `src/app/admin/reservations/page.tsx`: nuevo panel donde el admin ve todas las reservas, con:
    - Estados y datos clave (departamento, dueño, cliente, fechas, total).
    - Acciones sobre reservas pendientes: **Aprobar** o **Rechazar**, y puede **Cancelar** reservas ya aprobadas.

- **Navegación (Sidebar)**
  - `src/app/components/Sidebar.tsx`:
    - Para todos los usuarios autenticados añade: `Mis reservas` → `/myReservations`.
    - Para admin añade: `Reservas` → `/admin/reservations`.
    - Para dueños (owner) añade: `Mis Departamentos` → `/owner/properties` y `Reservas` → `/owner/reservations`.

## Notas de uso

- Para que un usuario sea tratado como **dueño de departamentos**, debe existir un documento en `propertyOwners/{email}` (o en `users/{email}` con `role: 'owner'`).
- Solo los elementos de inventario con `status: 'approved'` se consideran disponibles para reservas públicas.
- El flujo de fechas/huéspedes en `handleReserve` es básico y se puede extender fácilmente (selector de fechas, número de huéspedes, etc.).

## Próximos pasos sugeridos

- Añadir selección real de fechas y huéspedes en el detalle del departamento.
- Integrar aprobación de departamentos (cambio de `status`) directamente en el panel de inventario admin.
- Ajustar textos/estilos globales (home, navbar, etc.) para que el enfoque principal sea "reservas de departamentos" en lugar de una tienda genérica.
