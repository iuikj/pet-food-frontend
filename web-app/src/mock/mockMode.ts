import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
  STORAGE_KEYS,
} from '../utils/storage';

let mockMode = false;
let initialized = false;

export function isMockMode(): boolean {
  return mockMode;
}

export function isManualOverride(): boolean {
  return getStorageItem(STORAGE_KEYS.mockOverride) === 'true';
}

export function setMockMode(enabled: boolean): void {
  mockMode = enabled;
  setStorageItem(STORAGE_KEYS.mockMode, String(enabled));
  setStorageItem(STORAGE_KEYS.mockOverride, 'true');
}

export function clearMockOverride(): void {
  removeStorageItem(STORAGE_KEYS.mockOverride);
}

export async function initMockMode(): Promise<boolean> {
  if (initialized) {
    return mockMode;
  }

  if (getStorageItem(STORAGE_KEYS.mockOverride) === 'true') {
    mockMode = getStorageItem(STORAGE_KEYS.mockMode) === 'true';
    initialized = true;
    console.log(`[MockMode] Manual override: ${mockMode ? 'MOCK' : 'REAL'}`);
    return mockMode;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, '') + '/health';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timer);
    mockMode = !res.ok;
  } catch {
    mockMode = true;
  }

  initialized = true;
  setStorageItem(STORAGE_KEYS.mockMode, String(mockMode));
  console.log(`[MockMode] Auto-detected: ${mockMode ? 'MOCK (backend unreachable)' : 'REAL'}`);
  return mockMode;
}
