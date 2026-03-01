/**
 * API 服务统一导出
 *
 * 使用 ES6 Proxy 实现运行时条件路由：
 * - isMockMode() === true  → 分发到 mock handler
 * - isMockMode() === false → 分发到真实 API
 *
 * 对外导出名称完全不变，现有 Context/Page 代码零改动。
 */
import { isMockMode } from '../mock/mockMode';

// Real API modules
import realAuthApi from './auth';
import realPetsApi from './pets';
import realMealsApi from './meals';
import realCalendarApi from './calendar';
import realAnalysisApi from './analysis';
import realPlansApi from './plans';

// Mock API modules
import {
  mockAuthApi,
  mockPetsApi,
  mockMealsApi,
  mockCalendarApi,
  mockAnalysisApi,
  mockPlansApi,
} from '../mock';

/**
 * 创建 API Proxy：每次属性访问时实时判断 mock 模式
 */
function proxyApi<T extends object>(real: T, mock: T): T {
  return new Proxy({} as T, {
    get(_target, prop: string | symbol) {
      const source = isMockMode() ? mock : real;
      return (source as any)[prop];
    },
  });
}

export const authApi = proxyApi(realAuthApi, mockAuthApi);
export const petsApi = proxyApi(realPetsApi, mockPetsApi);
export const mealsApi = proxyApi(realMealsApi, mockMealsApi);
export const calendarApi = proxyApi(realCalendarApi, mockCalendarApi);
export const analysisApi = proxyApi(realAnalysisApi, mockAnalysisApi);
export const plansApi = proxyApi(realPlansApi, mockPlansApi);

// 透传不需要 proxy 的导出
export { default as apiClient } from './client';

// 导出所有类型
export * from './types';
