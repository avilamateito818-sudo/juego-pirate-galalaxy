import type { AuthResponse } from '@starcorsair/shared';

const TOKEN_STORAGE_KEY = 'starcorsair_jwt';

function getHttpBaseUrl(): string {
  if (import.meta.env.VITE_SERVER_HTTP_URL) {
    return import.meta.env.VITE_SERVER_HTTP_URL;
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  return `http://${host}:49267`;
}

export function loadStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveStoredToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignorar en modos privados restrictivos
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignorar
  }
}

async function parseAuthResponse(res: Response): Promise<AuthResponse> {
  const data = (await res.json()) as AuthResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Error HTTP ${res.status}`);
  }
  return data;
}

export async function registerPilot(
  callsign: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${getHttpBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callsign, email, password })
  });
  return parseAuthResponse(res);
}

export async function loginPilot(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${getHttpBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return parseAuthResponse(res);
}

export async function loginGuestPilot(callsign?: string): Promise<AuthResponse> {
  const res = await fetch(`${getHttpBaseUrl()}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callsign })
  });
  return parseAuthResponse(res);
}

export async function fetchCurrentPilot(token: string): Promise<AuthResponse> {
  const res = await fetch(`${getHttpBaseUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseAuthResponse(res);
}
