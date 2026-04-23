import apiClient from './client';
import type {
    ApiResponse,
    CreateIngredientRequest,
    Ingredient,
    IngredientCategoryItem,
    IngredientListParams,
    IngredientListResponse,
    ResolveIconsResponse,
    UpdateIngredientRequest,
} from './types';

/** 获取食材列表（分页） */
export async function getIngredients(
    params: IngredientListParams = {},
): Promise<ApiResponse<IngredientListResponse>> {
    return apiClient.get<any, ApiResponse<IngredientListResponse>>('/ingredients/', {
        params: {
            keyword: params.keyword || undefined,
            category: params.category || undefined,
            sub_category: params.sub_category || undefined,
            scope: params.scope || undefined,
            limit: params.limit ?? 50,
            offset: params.offset ?? 0,
        },
    });
}

/** 获取分类聚合 */
export async function getIngredientCategories(): Promise<ApiResponse<IngredientCategoryItem[]>> {
    return apiClient.get<any, ApiResponse<IngredientCategoryItem[]>>('/ingredients/categories');
}

/** 食材详情 */
export async function getIngredient(
    ingredientId: string,
): Promise<ApiResponse<Ingredient>> {
    return apiClient.get<any, ApiResponse<Ingredient>>(`/ingredients/${ingredientId}`);
}

/** 创建自定义食材 */
export async function createIngredient(
    data: CreateIngredientRequest,
): Promise<ApiResponse<Ingredient>> {
    return apiClient.post<any, ApiResponse<Ingredient>>('/ingredients/', data);
}

/** 更新自定义食材 */
export async function updateIngredient(
    ingredientId: string,
    data: UpdateIngredientRequest,
): Promise<ApiResponse<Ingredient>> {
    return apiClient.put<any, ApiResponse<Ingredient>>(`/ingredients/${ingredientId}`, data);
}

/** 删除自定义食材 */
export async function deleteIngredient(
    ingredientId: string,
): Promise<ApiResponse<{ id: string }>> {
    return apiClient.delete<any, ApiResponse<{ id: string }>>(`/ingredients/${ingredientId}`);
}

/** 批量按食材名解析图标（给 FoodItem.name 用） */
export async function resolveIcons(
    names: string[],
): Promise<ApiResponse<ResolveIconsResponse>> {
    return apiClient.post<any, ApiResponse<ResolveIconsResponse>>('/ingredients/resolve-icons', {
        names,
    });
}

export const ingredientsApi = {
    getIngredients,
    getIngredientCategories,
    getIngredient,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    resolveIcons,
};

export default ingredientsApi;
