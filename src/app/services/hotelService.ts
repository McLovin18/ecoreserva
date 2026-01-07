"use client";

import { apiFetch } from "../utils/apiClient";

export interface Hotel {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  isActive: boolean;
  ownerEmail: string;
}
}

export interface CreateHotelPayload {
  name: string;
  description?: string;
  ownerEmail: string;
  location?: string;
}
}

export const hotelService = {
  async getAllHotels(): Promise<Hotel[]> {
    const rows = await apiFetch<any[]>("/api/hospedajes/admin", { method: "GET" });
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type ?? row.tipo_hospedaje ?? "Hotel",
      status: row.status ?? row.estado ?? "Activo",
      isActive: Boolean(row.isActive ?? row.estado === "Activo"),
      ownerEmail: row.ownerEmail ?? row.owner_email ?? "",
    }));
  },

  async createHotel(payload: CreateHotelPayload): Promise<Hotel> {
    const body: any = {
      name: payload.name,
      description: payload.description || "",
      ownerEmail: payload.ownerEmail,
    };

    // Si el admin indica una ubicación textual, la enviamos
    // para que el backend cree una entrada en dbo.Ubicacion.
    if (payload.location && payload.location.trim()) {
      body.comunidad = payload.location.trim();
      body.canton = payload.location.trim();
      body.provincia = payload.location.trim();
    }

    const created = await apiFetch<{ id: number }>("/api/hospedajes", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      id: created.id,
      name: payload.name,
      description: payload.description || "",
      type: "Hotel",
      status: "Activo",
      isActive: true,
      ownerEmail: payload.ownerEmail,
    };
  },

  async updateHotelStatus(id: number, status: string): Promise<void> {
    await apiFetch(`/api/hospedajes/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
