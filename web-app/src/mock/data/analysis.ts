/**
 * 营养分析 Mock 数据
 */
import type { NutritionAnalysisResponse } from '../../api/types';
import { today } from '../utils';

/** 生成最近 N 天的日期数组 */
function recentDates(n: number): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export function getMockNutritionAnalysis(period: 'week' | 'month' | 'year' = 'week'): NutritionAnalysisResponse {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const dates = recentDates(days);

  // 生成波动的每日数据
  const dailyData = dates.map((date) => ({
    date,
    calories: 1200 + Math.round(Math.random() * 300),
    protein: 80 + Math.round(Math.random() * 30),
    fat: 30 + Math.round(Math.random() * 15),
    carbs: 150 + Math.round(Math.random() * 60),
    completion_rate: Math.round(60 + Math.random() * 40),
  }));

  return {
    period,
    summary: {
      total_calories: 1350,
      consumed_calories: 1100,
      protein: { target: 93, consumed: 78 },
      fat: { target: 37, consumed: 30 },
      carbs: { target: 180, consumed: 145 },
    },
    daily_data: dailyData,
    trend_chart: {
      calories: dailyData.map((d) => d.calories),
      protein: dailyData.map((d) => d.protein),
      fat: dailyData.map((d) => d.fat),
      carbs: dailyData.map((d) => d.carbs),
      dates,
    },
    ai_insights: [
      { type: 'positive', content: 'Cooper 本周蛋白质摄入达标率 85%，整体营养均衡。' },
      { type: 'suggestion', content: '建议适当增加 Omega-3 脂肪酸摄入，可在晚餐中添加少量鱼油。' },
      { type: 'positive', content: '体重保持稳定在 28.5kg，处于金毛犬健康范围内。' },
      { type: 'warning', content: '连续 2 天午餐未按时完成，请注意保持喂食规律。' },
    ],
  };
}
