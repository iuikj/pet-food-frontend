import type { TokenData } from '../api/types';

export const STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  activePlanMap: 'activePlanMap',
  activePlanDataMap: 'activePlanDataMap',
  mockMode: 'pet_app_mock_mode',
  mockOverride: 'pet_app_mock_override',
  mockPets: 'pet_app_mock_pets',
  mockUser: 'pet_app_mock_user',
} as const;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getStorageItem(key: string): string | null {
  return getStorage()?.getItem(key) ?? null;
}

export function setStorageItem(key: string, value: string): void {
  getStorage()?.setItem(key, value);
}

export function removeStorageItem(key: string): void {
  getStorage()?.removeItem(key);
}

export function getAccessToken(): string | null {
  return getStorageItem(STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return getStorageItem(STORAGE_KEYS.refreshToken);
}

export function setAuthTokens(tokens: Pick<TokenData, 'access_token' | 'refresh_token'>): void {
  setStorageItem(STORAGE_KEYS.accessToken, tokens.access_token);
  setStorageItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
}

export function clearAuthTokens(): void {
  removeStorageItem(STORAGE_KEYS.accessToken);
  removeStorageItem(STORAGE_KEYS.refreshToken);
}

export function readJSON<T>(key: string, fallback: T): T {
  const rawValue = getStorageItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  setStorageItem(key, JSON.stringify(value));
}
