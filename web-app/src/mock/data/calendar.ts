/**
 * 日历 Mock 数据
 */
import type { MonthlyCalendarResponse, WeeklyCalendarResponse, CalendarStatus } from '../../api/types';
import { today } from '../utils';

/** 生成月度日历 mock */
export function getMockMonthlyCalendar(year?: number, month?: number): MonthlyCalendarResponse {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayDate = now.getDate();

  const statuses: CalendarStatus[] = ['excellent', 'good', 'normal', 'poor'];

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isPast = day < todayDate;
    const isToday = day === todayDate;

    if (!isPast && !isToday) {
      return { date: dateStr, has_plan: true, completion_rate: 0, total_meals: 3, completed_meals: 0, status: 'none' as CalendarStatus };
    }

    const completedMeals = isToday ? 1 : Math.floor(Math.random() * 3) + 1;
    const rate = Math.round((completedMeals / 3) * 100);
    const status = completedMeals === 3 ? 'excellent' : completedMeals === 2 ? 'good' : completedMeals === 1 ? 'normal' : 'poor';

    return { date: dateStr, has_plan: true, completion_rate: rate, total_meals: 3, completed_meals: completedMeals, status };
  });

  return { year: y, month: m, days };
}

/** 生成周度日历 mock */
export function getMockWeeklyCalendar(): WeeklyCalendarResponse {
  const todayStr = today();
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 1=Mon ... 7=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const completedMeals = isToday ? 1 : isPast ? Math.floor(Math.random() * 3) + 1 : 0;
    const rate = Math.round((completedMeals / 3) * 100);

    return {
      date: dateStr,
      day_of_week: i + 1,
      has_plan: true,
      completion_rate: rate,
      total_meals: 3,
      completed_meals: completedMeals,
      status: (completedMeals === 3 ? 'excellent' : completedMeals >= 2 ? 'good' : completedMeals >= 1 ? 'normal' : 'none') as CalendarStatus,
      meals: [], // 简化，不展开每日餐食详情
    };
  });

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    week_number: Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7),
    start_date: monday.toISOString().slice(0, 10),
    end_date: sunday.toISOString().slice(0, 10),
    days,
  };
}
