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
    const res = await apiClient.get<ApiResponse<MonthlyCalendarResponse>>('/calendar/monthly', {
        params: { pet_id: petId, year, month },
    });
    return res.data;
}

/**
 * 获取周视图
 */
export async function getWeeklyCalendar(
    petId: string,
    startDate?: string
): Promise<ApiResponse<WeeklyCalendarResponse>> {
    const res = await apiClient.get<ApiResponse<WeeklyCalendarResponse>>('/calendar/weekly', {
        params: { pet_id: petId, start_date: startDate },
    });
    return res.data;
}

// 导出所有函数
export const calendarApi = {
    getMonthlyCalendar,
    getWeeklyCalendar,
};

export default calendarApi;
