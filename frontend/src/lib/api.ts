import type { ApiResponse, PaginatedResponse, ApiError } from '@/types';

// En producción (GitHub Pages), VITE_API_URL debe apuntar al backend real
// En desarrollo, Vite proxy redirige /api → localhost:3001
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshTokenValue = refresh;
  localStorage.setItem('auth_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshTokenValue = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
}

export function loadTokens() {
  accessToken = localStorage.getItem('auth_token');
  refreshTokenValue = localStorage.getItem('refresh_token');
}

loadTokens();

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    setTokens(data.accessToken || data.token, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean; signal?: AbortSignal }
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!options?.skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: options?.signal,
  };

  if (body && method !== 'GET') {
    if (body instanceof FormData) {
      fetchOptions.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  // Manejo automático de 401 con refresh
  if (res.status === 401 && !options?.skipAuth && refreshTokenValue) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
    } else {
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      success: false,
      message: `Error ${res.status}: ${res.statusText}`,
      timestamp: new Date().toISOString(),
    }));
    throw error;
  }

  return res.json();
}

const api = {
  get<T>(path: string, signal?: AbortSignal) {
    return request<T>('GET', path, undefined, { signal });
  },

  post<T>(path: string, body?: unknown) {
    return request<T>('POST', path, body);
  },

  put<T>(path: string, body?: unknown) {
    return request<T>('PUT', path, body);
  },

  patch<T>(path: string, body?: unknown) {
    return request<T>('PATCH', path, body);
  },

  delete<T>(path: string) {
    return request<T>('DELETE', path);
  },

  // Helper para respuestas paginadas
  getPaginated<T>(path: string, signal?: AbortSignal) {
    return request<PaginatedResponse<T>>('GET', path, undefined, { signal });
  },

  // Upload con FormData
  upload<T>(path: string, formData: FormData) {
    return request<T>('POST', path, formData);
  },
};

export { api, request };
export type { ApiResponse, PaginatedResponse, ApiError };
