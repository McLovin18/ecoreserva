"use client";

import { apiFetch } from "../utils/apiClient";

export type ReservationStatus =
  | 'pending_admin' // creada por cliente, esperando aprobación del admin
  | 'approved'      // aprobada por admin
  | 'rejected'
  | 'cancelled'
  | 'checked_in'
  | 'checked_out'
  | 'completed';

export interface Reservation {
  id?: string;
  propertyId: number;
  departmentId?: number | null;
  propertyName: string;
  ownerEmail: string;
  userEmail: string;
  userName?: string;
  total: number;
  startDate: string; // ISO
  endDate: string;   // ISO
  guests?: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'confirmed' | 'cancelled';
  status: ReservationStatus;
  createdAt: string;
  notes?: string;
}

// 🧮 Genera un ID numérico simple reutilizando timestamp (coincide con productId cuando no existe)
const generatePropertyId = () => Math.floor(Date.now() / 1000);

export const reservationService = {
  async createReservation(
    payload: Omit<Reservation, "id" | "status" | "createdAt">
  ): Promise<string> {
    // Validación simple de fechas y personas
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new Error("Las fechas de ingreso y salida no son válidas.");
    }
    if (payload.guests !== undefined && payload.guests <= 0) {
      throw new Error("El número de personas debe ser mayor a cero.");
    }

    // Para hospedajes, la disponibilidad real se valida en el backend
    // mediante verificación de solapamiento de reservas; no usamos stock.

    const created = await apiFetch<{ id: number }>("/api/reservas", {
      method: "POST",
      body: JSON.stringify({
        propertyId: payload.propertyId,
        departmentId: payload.departmentId ?? null,
        propertyName: payload.propertyName,
        ownerEmail: payload.ownerEmail,
        total: payload.total,
        startDate: payload.startDate,
        endDate: payload.endDate,
        guests: payload.guests,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
      }),
    });

    return String(created.id);
  },

  async updateReservationStatus(reservationId: string, status: ReservationStatus): Promise<void> {
    await apiFetch(`/api/reservas/${reservationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getReservationsForOwner(ownerEmail: string): Promise<Reservation[]> {
    if (!ownerEmail) return [];
    // El backend resuelve al owner a partir del token, ignoramos email aquí
    const rows = await apiFetch<any[]>('/api/reservas/owner/me', {
      method: 'GET',
    });
    return rows.map((row) => ({
      id: String(row.id_reserva),
      propertyId: row.id_hospedaje,
      propertyName: '',
      ownerEmail,
      userEmail: '',
      total: Number(row.monto_total),
      startDate: row.fecha_inicio,
      endDate: row.fecha_fin,
      guests: row.huespedes,
      paymentMethod: row.metodo_pago,
      paymentStatus: row.estado_pago,
      status: row.estado,
      createdAt: row.fecha_inicio,
      notes: row.notas,
    } as Reservation));
  },

  async getReservationsForUser(userEmail: string): Promise<Reservation[]> {
    if (!userEmail) return [];

    try {
      const rows = await apiFetch<any[]>('/api/reservas/me', { method: 'GET' });
      if (!Array.isArray(rows)) return [];

      return rows.map((row) => ({
        id: String(row.id_reserva),
        propertyId: row.id_hospedaje,
        propertyName: '',
        ownerEmail: '',
        userEmail,
        total: Number(row.monto_total),
        startDate: row.fecha_inicio,
        endDate: row.fecha_fin,
        guests: row.huespedes,
        paymentMethod: row.metodo_pago,
        paymentStatus: row.estado_pago,
        status: row.estado,
        createdAt: row.fecha_inicio,
        notes: row.notas,
      } as Reservation));
    } catch (err) {
      console.error('Error obteniendo reservas del usuario', err);
      // Si hay cualquier problema al consultar, devolvemos lista vacía
      // para que la UI muestre el estado "sin reservas" en lugar de romper.
      return [];
    }
  },

  async getAllReservations(): Promise<Reservation[]> {
    const rows = await apiFetch<any[]>('/api/reservas', { method: 'GET' });
    return rows.map((row) => ({
      id: String(row.id_reserva),
      propertyId: row.id_hospedaje,
      propertyName: '',
      ownerEmail: '',
      userEmail: '',
      total: Number(row.monto_total),
      startDate: row.fecha_inicio,
      endDate: row.fecha_fin,
      guests: row.huespedes,
      paymentMethod: row.metodo_pago,
      paymentStatus: row.estado_pago,
      status: row.estado,
      createdAt: row.fecha_inicio,
      notes: row.notas,
    } as Reservation));
  },

  async updateReservationDates(
    reservationId: string,
    startDate: string,
    endDate: string,
    guests?: number
  ): Promise<void> {
    // En este punto, el backend es la fuente de verdad; el frontend solo valida fechas.
    const currentReservations = await this.getAllReservations();
    const current = currentReservations.find((r) => r.id === reservationId);
    if (!current) throw new Error('Reserva no encontrada');

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new Error('El rango de fechas no es válido.');
    }
    if (guests !== undefined && guests <= 0) {
      throw new Error('El número de personas debe ser mayor a cero.');
    }

    // Verificar que la reserva sigue en estado editable
    if (current.status !== 'pending_admin') {
      throw new Error('Solo puedes editar reservas pendientes de aprobación.');
    }

    // Verificar solapamiento simple en memoria con las demás reservas
    const overlaps = currentReservations.some((res) => {
      if (res.id === reservationId || res.propertyId !== current.propertyId) return false;
      const existingStart = new Date(res.startDate).getTime();
      const existingEnd = new Date(res.endDate).getTime();
      return start.getTime() < existingEnd && end.getTime() > existingStart;
    });

    if (overlaps) {
      throw new Error('Las nuevas fechas se solapan con otra reserva existente.');
    }

    // Actualización de la reserva en backend (requiere endpoint adicional si se desea persistir)
    await apiFetch(`/api/reservas/${reservationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ startDate, endDate, guests }),
    });
  }
};
