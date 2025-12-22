'use client';

import { apiFetch } from '../utils/apiClient';

export interface Activity {
  id?: string;
  hostEmail: string; // anfitrión dueño del hospedaje
  propertyId: number; // id del hospedaje/departamento al que se asocia
  name: string;
  description?: string;
  price: number;
  type?: string; // tipo de actividad: aventura, cultural, etc.
  isActive: boolean;
  createdAt: string;
}

export const activityService = {
  async createOrUpdateActivity(payload: Activity): Promise<string> {
    const body = {
      propertyId: payload.propertyId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      typeName: payload.type,
    };

    // Si viene un id, hacemos actualización; si no, creación
    if (payload.id) {
      await apiFetch(`/api/actividades/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return payload.id;
    }

    const created = await apiFetch<{ id: number }>('/api/actividades', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return String(created.id);
  },

  async deleteActivity(id: string): Promise<void> {
    await apiFetch(`/api/actividades/${id}`, {
      method: 'DELETE',
    });
  },

  async getActivitiesByHost(hostEmail: string): Promise<Activity[]> {
    if (!hostEmail) return [];
    const rows = await apiFetch<any[]>('/api/actividades/owner/me', { method: 'GET' });
    return rows.map((row) => ({
      id: String(row.id),
      hostEmail,
      propertyId: row.propertyId,
      name: row.name,
      description: row.description,
      price: row.price,
      type: row.type,
      isActive: true,
      createdAt: new Date().toISOString(),
    } as Activity));
  },

  async getActivitiesByProperty(propertyId: number): Promise<Activity[]> {
    if (!propertyId) return [];
    const rows = await apiFetch<any[]>(`/api/actividades/hospedaje/${propertyId}`, {
      method: 'GET',
    });

    return rows.map((row) => ({
      id: String(row.id),
      hostEmail: '',
      propertyId: row.propertyId,
      name: row.name,
      description: row.description,
      price: row.price,
      type: row.type,
      isActive: true,
      createdAt: new Date().toISOString(),
    } as Activity));
  },

  async getActivityById(id: string): Promise<Activity | null> {
    // Búsqueda simple en todas las actividades de todos los hospedajes del usuario actual no está disponible aún
    console.warn('getActivityById aún no está optimizado; usa getActivitiesByProperty cuando sea posible.');
    return null;
  },
};
