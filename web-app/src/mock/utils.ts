/**
 * Mock 工具函数
 */
import type { ApiResponse } from '../api/types';

/** 模拟网络延迟 (200-500ms 随机) */
export function delay(ms?: number): Promise<void> {
  const time = ms ?? (200 + Math.random() * 300);
  return new Promise((resolve) => setTimeout(resolve, time));
}

/** 包装成标准 ApiResponse 格式 */
export function mockResponse<T>(data: T, code = 0, message = 'success'): ApiResponse<T> {
  return { code, message, data };
}

/** 生成 mock ID */
let _idCounter = 0;
export function generateId(): string {
  _idCounter++;
  return `mock-${Date.now().toString(36)}-${_idCounter}`;
}

/** 当前日期字符串 YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
