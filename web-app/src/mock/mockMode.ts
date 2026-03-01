/**
 * Mock 模式检测与状态管理
 *
 * 策略：
 * 1. localStorage 有手动 override → 使用 override 值
 * 2. 否则检测 /health → 不可达则自动启用 mock
 */

const MOCK_MODE_KEY = 'pet_app_mock_mode';
const MOCK_OVERRIDE_KEY = 'pet_app_mock_override';

let _mockMode = false;
let _initialized = false;

/** 是否当前处于 mock 模式（同步读取） */
export function isMockMode(): boolean {
  return _mockMode;
}

/** 是否为手动 override */
export function isManualOverride(): boolean {
  return localStorage.getItem(MOCK_OVERRIDE_KEY) === 'true';
}

/** 手动切换 mock 模式 */
export function setMockMode(enabled: boolean): void {
  _mockMode = enabled;
  localStorage.setItem(MOCK_MODE_KEY, String(enabled));
  localStorage.setItem(MOCK_OVERRIDE_KEY, 'true');
}

/** 清除手动 override，恢复自动检测 */
export function clearMockOverride(): void {
  localStorage.removeItem(MOCK_OVERRIDE_KEY);
}

/**
 * 初始化 mock 模式（异步）
 * - 有手动 override → 直接使用
 * - 否则 → 探测后端 /health
 */
export async function initMockMode(): Promise<boolean> {
  if (_initialized) return _mockMode;

  // 1. 检查手动 override
  if (localStorage.getItem(MOCK_OVERRIDE_KEY) === 'true') {
    _mockMode = localStorage.getItem(MOCK_MODE_KEY) === 'true';
    _initialized = true;
    console.log(`[MockMode] Manual override: ${_mockMode ? 'MOCK' : 'REAL'}`);
    return _mockMode;
  }

  // 2. 自动检测后端
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  // /health 通常在 API 前缀的上级
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, '') + '/health';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);

    _mockMode = !res.ok;
  } catch {
    // 网络错误、超时、abort → 后端不可达
    _mockMode = true;
  }

  _initialized = true;
  localStorage.setItem(MOCK_MODE_KEY, String(_mockMode));
  console.log(`[MockMode] Auto-detected: ${_mockMode ? 'MOCK (backend unreachable)' : 'REAL'}`);
  return _mockMode;
}
