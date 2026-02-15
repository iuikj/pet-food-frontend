/**
 * 营养分析 API 服务
 */
import apiClient from './client';
import type { ApiResponse, NutritionAnalysisResponse } from './types';

/**
 * 获取营养分析
 */
export async function getNutritionAnalysis(
    petId: string,
    period: 'week' | 'month' | 'year' = 'week'
): Promise<ApiResponse<NutritionAnalysisResponse>> {
    const res = await apiClient.get<ApiResponse<NutritionAnalysisResponse>>('/analysis/nutrition', {
        params: { pet_id: petId, period },
    });
    return res.data;
}

// 导出所有函数
export const analysisApi = {
    getNutritionAnalysis,
};

export default analysisApi;
