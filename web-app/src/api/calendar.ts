/**
 * 日历 API 服务
 */
import apiClient from './client';
import type {
    ApiResponse,
    MonthlyCalendarResponse,
    WeeklyCalendarResponse,
} from './types';

/**
 * 获取月度日历
 */
export async function getMonthlyCalendar(
    petId: string,
    year?: number,
    month?: number
): Promise<ApiResponse<MonthlyCalendarResponse>> {
    return apiClient.get<any, ApiResponse<MonthlyCalendarResponse>>('/calendar/monthly', {
        params: { pet_id: petId, year, month },
    });
}

/**
 * 获取周视图
 */
export async function getWeeklyCalendar(
    petId: string,
    startDate?: string
): Promise<ApiResponse<WeeklyCalendarResponse>> {
    return apiClient.get<any, ApiResponse<WeeklyCalendarResponse>>('/calendar/weekly', {
        params: { pet_id: petId, start_date: startDate },
    });
}

// 导出所有函数
export const calendarApi = {
    getMonthlyCalendar,
    getWeeklyCalendar,
};

export default calendarApi;
