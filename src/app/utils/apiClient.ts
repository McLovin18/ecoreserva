"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface ApiError extends Error {
  code?: string;
  status?: number;
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let code: string | undefined;
  let message = `Error ${res.status}`;
  try {
    const data = await res.json();
    if (data && typeof data === "object") {
      if (data.message && typeof data.message === "string") {
        message = data.message;
      }
      if (data.code && typeof data.code === "string") {
        code = data.code;
      }
    }
  } catch {
    // ignore JSON parse errors
  }

  const err: ApiError = new Error(message);
  err.code = code;
  err.status = res.status;
  return err;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const token = isBrowser ? window.localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token && !(options.headers as any)?.Authorization) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  // No content
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export { API_BASE_URL };
