import type { TokenData } from '../api/types';

export const STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  activePlanMap: 'activePlanMap',
  activePlanDataMap: 'activePlanDataMap',
  selectedPetMap: 'selectedPetMap',
  mockMode: 'pet_app_mock_mode',
  mockOverride: 'pet_app_mock_override',
  mockPets: 'pet_app_mock_pets',
  mockUser: 'pet_app_mock_user',
  pendingPlanTask: 'pending_plan_task',
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

// ────────────────────────────────────────────
// 生成中任务持久化（支持清后台/杀进程恢复）
// ────────────────────────────────────────────

export interface PendingPlanTask {
  taskId: string;
  startedAt: number;  // epoch ms
  petSnapshot?: Record<string, unknown>;
}

// 后端 temp_plan Redis TTL 为 24h，任务流 Redis Stream 也是 24h
// 前端过期阈值略短于后端，避免拿到已 GC 的任务
const PENDING_TASK_TTL_MS = 23 * 60 * 60 * 1000;

export function savePendingPlanTask(task: PendingPlanTask): void {
  writeJSON(STORAGE_KEYS.pendingPlanTask, task);
}

export function loadPendingPlanTask(): PendingPlanTask | null {
  const data = readJSON<PendingPlanTask | null>(STORAGE_KEYS.pendingPlanTask, null);
  if (!data || !data.taskId || !data.startedAt) {
    return null;
  }

  const age = Date.now() - data.startedAt;
  if (age < 0 || age > PENDING_TASK_TTL_MS) {
    // 过期或时间异常 — 清理并视作无任务
    clearPendingPlanTask();
    return null;
  }

  return data;
}

export function clearPendingPlanTask(): void {
  removeStorageItem(STORAGE_KEYS.pendingPlanTask);
}
