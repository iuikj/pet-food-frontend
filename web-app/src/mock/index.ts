/**
 * Mock 层统一导出
 */

// 模式管理
export { initMockMode, isMockMode, setMockMode, isManualOverride, clearMockOverride } from './mockMode';

// Handlers（与真实 API 同名同签名）
export { mockAuthApi } from './handlers/auth';
export { mockPetsApi } from './handlers/pets';
export { mockMealsApi } from './handlers/meals';
export { mockPlansApi } from './handlers/plans';

// Calendar & Analysis（简单模块，直接在此导出 handler 对象）
import type { ApiResponse, MonthlyCalendarResponse, WeeklyCalendarResponse, NutritionAnalysisResponse } from '../api/types';
import { getMockMonthlyCalendar, getMockWeeklyCalendar } from './data/calendar';
import { getMockNutritionAnalysis } from './data/analysis';
import { delay, mockResponse } from './utils';

export const mockCalendarApi = {
  async getMonthlyCalendar(_petId: string, year?: number, month?: number): Promise<ApiResponse<MonthlyCalendarResponse>> {
    await delay();
    return mockResponse(getMockMonthlyCalendar(year, month));
  },
  async getWeeklyCalendar(_petId: string, _startDate?: string): Promise<ApiResponse<WeeklyCalendarResponse>> {
    await delay();
    return mockResponse(getMockWeeklyCalendar());
  },
};

export const mockAnalysisApi = {
  async getNutritionAnalysis(_petId: string, period: 'week' | 'month' | 'year' = 'week'): Promise<ApiResponse<NutritionAnalysisResponse>> {
    await delay();
    return mockResponse(getMockNutritionAnalysis(period));
  },
};
