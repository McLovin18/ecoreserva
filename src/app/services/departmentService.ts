"use client";

import { apiFetch } from "../utils/apiClient";

export interface Department {
  id: number;
  hotelId: number;
  hotelName: string;
  name: string;
  description?: string;
  price: number;
  capacity?: number | null;
  status: string;
}

export const departmentService = {
  async getDepartmentsForOwner(): Promise<Department[]> {
    const rows = await apiFetch<any[]>("/api/departamentos/owner/me", {
      method: "GET",
    });

    return rows.map((row) => ({
      id: row.id,
      hotelId: row.hotelId,
      hotelName: row.hotelName,
      name: row.name,
      description: row.description,
      price: row.price,
      capacity: row.capacity ?? null,
      status: row.status,
    } as Department));
  },

  async createDepartment(payload: {
    hotelId: number;
    name: string;
    price: number;
    description?: string;
    capacity?: number;
  }): Promise<number> {
    const created = await apiFetch<{ id: number }>("/api/departamentos", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return created.id;
  },

  // Departamentos pendientes para revisión del admin
  async getPendingForAdmin(): Promise<{
    id: number;
    hotelId: number;
    hotelName: string;
    ownerEmail: string;
    name: string;
    description?: string;
    price: number;
    capacity?: number | null;
    status: string;
  }[]> {
    const rows = await apiFetch<any[]>("/api/departamentos/pending", {
      method: "GET",
    });

    return rows.map((row) => ({
      id: row.id,
      hotelId: row.hotelId,
      hotelName: row.hotelName,
      ownerEmail: row.ownerEmail,
      name: row.name,
      description: row.description,
      price: row.price,
      capacity: row.capacity ?? null,
      status: row.status,
    }));
  },

  async updateDepartmentStatus(id: number, status: 'Aprobado' | 'Rechazado'): Promise<void> {
    await apiFetch(`/api/departamentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Departamentos aprobados visibles para turistas por hotel
  async getApprovedByHotel(hotelId: number): Promise<Department[]> {
    const rows = await apiFetch<any[]>(`/api/departamentos/by-hotel/${hotelId}`, {
      method: 'GET',
    });

    return rows.map((row) => ({
      id: row.id,
      hotelId: row.hotelId,
      hotelName: row.hotelName,
      name: row.name,
      description: row.description,
      price: row.price,
      capacity: row.capacity ?? null,
      status: row.status,
    } as Department));
  },
};
