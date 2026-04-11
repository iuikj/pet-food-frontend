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
import type { ApiResponse, MonthlyCalendarResponse, WeeklyCalendarResponse, NutritionAnalysisResponse, TodoListResponse, TodoItem } from '../api/types';
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

// 内存中存储 mock 待办数据
let _mockTodos: TodoItem[] = [];

export const mockTodosApi = {
  async getTodos(_params?: any): Promise<ApiResponse<TodoListResponse>> {
    await delay();
    return mockResponse({ total: _mockTodos.length, items: [..._mockTodos] });
  },
  async createTodo(data: any): Promise<ApiResponse<TodoItem>> {
    await delay();
    const todo: TodoItem = {
      id: `mock-${Date.now()}`,
      user_id: 'mock-user',
      pet_id: data.pet_id,
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      due_time: data.due_time,
      is_all_day: data.is_all_day ?? true,
      is_completed: false,
      priority: data.priority ?? 'medium',
      category: data.category ?? 'other',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    _mockTodos.push(todo);
    return mockResponse(todo);
  },
  async updateTodo(id: string, data: any): Promise<ApiResponse<TodoItem>> {
    await delay();
    const idx = _mockTodos.findIndex(t => t.id === id);
    if (idx >= 0) {
      _mockTodos[idx] = { ..._mockTodos[idx], ...data, updated_at: new Date().toISOString() };
      return mockResponse(_mockTodos[idx]);
    }
    return mockResponse(null as any);
  },
  async deleteTodo(id: string): Promise<ApiResponse<any>> {
    await delay();
    _mockTodos = _mockTodos.filter(t => t.id !== id);
    return mockResponse({ todo_id: id });
  },
  async completeTodo(id: string): Promise<ApiResponse<any>> {
    await delay();
    const todo = _mockTodos.find(t => t.id === id);
    if (todo) {
      todo.is_completed = true;
      todo.completed_at = new Date().toISOString();
    }
    return mockResponse({ todo_id: id, is_completed: true });
  },
  async uncompleteTodo(id: string): Promise<ApiResponse<any>> {
    await delay();
    const todo = _mockTodos.find(t => t.id === id);
    if (todo) {
      todo.is_completed = false;
      todo.completed_at = undefined;
    }
    return mockResponse({ todo_id: id, is_completed: false });
  },
};
