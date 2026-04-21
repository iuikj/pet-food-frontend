/**
 * Pet-Food API 类型定义
 * 基于后端 docs/frontend/README.md
 */

// ==================== 通用类型 ====================

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

// ==================== 认证类型 ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface VerifyRegisterRequest extends RegisterRequest {
  code: string;
}

export interface SendCodeRequest {
  email: string;
  code_type: 'register' | 'password_reset';
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  phone?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  is_pro: boolean;
  plan_type?: 'monthly' | 'yearly';
  subscription_expired_at?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  user: UserInfo;
  tokens: TokenData;
}

export interface SubscriptionStatusResponse {
  is_pro: boolean;
  plan_type?: 'monthly' | 'yearly';
  subscription_expired_at?: string;
  is_expired: boolean;
  days_remaining?: number;
}

// ==================== 宠物类型 ====================

export type PetType = 'cat' | 'dog';
export type PetGender = 'male' | 'female';

export interface CreatePetRequest {
  name: string;
  type: PetType;
  breed?: string;
  age: number;
  weight: number;
  gender?: PetGender;
  health_status?: string;
  special_requirements?: string;
}

export interface UpdatePetRequest {
  name?: string;
  type?: PetType;
  breed?: string;
  age?: number;
  weight?: number;
  gender?: PetGender;
  health_status?: string;
  special_requirements?: string;
}

export interface PetResponse {
  id: string;
  user_id: string;
  name: string;
  type: PetType;
  breed?: string;
  age: number;
  weight: number;
  gender?: PetGender;
  avatar_url?: string;
  health_status?: string;
  special_requirements?: string;
  is_active: boolean;
  has_plan: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetListResponse {
  total: number;
  items: PetResponse[];
}

// ==================== 饮食计划类型 ====================

export interface CreatePlanRequest {
  pet_id?: string;
  pet_type?: PetType;
  pet_breed?: string;
  pet_age?: number;
  pet_weight?: number;
  health_status?: string;
  special_requirements?: string;
}

export interface NutrientAmount {
  value: number;
  unit: string;
}

export type NutrientAmountLike = number | NutrientAmount;

export interface Micronutrients {
  vitamin_a: NutrientAmountLike;
  vitamin_c: NutrientAmountLike;
  vitamin_d: NutrientAmountLike;
  vitamin_e: NutrientAmountLike;
  calcium: NutrientAmountLike;
  iron: NutrientAmountLike;
  sodium: NutrientAmountLike;
  potassium: NutrientAmountLike;
  phosphorus: NutrientAmountLike;
  zinc: NutrientAmountLike;
  taurine: NutrientAmountLike;
  cholesterol: NutrientAmountLike;
  additional_nutrients: Record<string, NutrientAmountLike>;
}

export interface Macronutrients {
  protein: number;
  fat: number;
  carbohydrates: number;
  dietary_fiber: number;
}

export interface FoodItem {
  name: string;
  weight: number;
  macro_nutrients: Macronutrients;
  micro_nutrients: Micronutrients;
  recommend_reason: string;
}

export interface PlanResponse {
  id: string;
  user_id: string;
  task_id?: string;
  pet_id?: string;
  pet_type: PetType;
  pet_breed?: string;
  pet_age: number;
  pet_weight: number;
  health_status?: string;
  plan_data: any;
  created_at: string;
  updated_at?: string;
}

export interface PlanSummaryResponse {
  id: string;
  task_id?: string;
  pet_id?: string;
  pet_type: PetType;
  pet_breed?: string;
  pet_age: number;
  pet_weight: number;
  health_status?: string;
  is_active: boolean;
  applied_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface PlanListResponse {
  total: number;
  page?: number;
  page_size?: number;
  items: PlanSummaryResponse[];
}

// ==================== 任务类型 ====================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskResponse {
  id: string;
  task_type: string;
  status: TaskStatus;
  progress: number;
  current_node?: string;
  input_data: any;
  output_data?: any;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ==================== SSE 事件类型 ====================

export type SSEEventType =
  | 'task_created'
  | 'resumed'
  | 'progress_update'
  | 'node_started'
  | 'node_completed'
  | 'tool_started'
  | 'tool_completed'
  | 'llm_started'
  | 'llm_token'
  | 'task_completed'
  | 'final_result'
  | 'done'
  | 'error'
  // V1 研究阶段
  | 'research_starting'
  | 'research_task_delegating'
  | 'research_finalizing'
  | 'plan_created'
  | 'plan_updated'
  | 'task_delegating'
  // V1 分发 + 周计划阶段
  | 'dispatching'
  | 'week_planning'
  | 'week_searching'
  | 'week_plan_ready'
  | 'week_writing'
  | 'week_completed'
  // V1 汇总阶段
  | 'gathering'
  | 'structuring'
  | 'structured'
  | 'completed';

export interface SSEEvent {
  type: SSEEventType;
  task_id?: string;
  plan_id?: string;
  node?: string;
  tool?: string;
  progress?: number;
  timestamp?: string;
  result?: any;
  error?: string;
  message?: string;
  task_name?: string;
  detail?: any;
  data?: any;
}

// ==================== 饮食记录类型 ====================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealDetail {
  id: string;
  type: MealType;
  name: string;
  time: string;
  description?: string;
  calories?: number;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  food_items?: any[];
  nutrition_data?: any;
  ai_tip?: string;
}

export interface NutritionSummary {
  total_calories: number;
  consumed_calories: number;
  protein: { target: number; consumed: number };
  fat: { target: number; consumed: number };
  carbs: { target: number; consumed: number };
  fiber?: { target: number; consumed: number };
}

export interface TodayMealsResponse {
  date: string;
  meals: MealDetail[];
  nutrition_summary: NutritionSummary;
}

export interface MealHistoryResponse extends PaginatedResponse<MealDetail> {}

export interface CompleteMealRequest {
  notes?: string;
}

export interface MealCompleteResponse {
  meal_id: string;
  is_completed: boolean;
  completed_at?: string;
}

// ==================== 日历类型 ====================

export type CalendarStatus = 'excellent' | 'good' | 'normal' | 'poor' | 'none';

export interface CalendarDay {
  date: string;
  has_plan: boolean;
  completion_rate: number;
  total_meals: number;
  completed_meals: number;
  status: CalendarStatus;
}

export interface MonthlyCalendarResponse {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface WeekDay extends CalendarDay {
  day_of_week: number;
  meals: MealDetail[];
}

export interface WeeklyCalendarResponse {
  week_number: number;
  start_date: string;
  end_date: string;
  days: WeekDay[];
}

// ==================== 营养分析类型 ====================

export type InsightType = 'positive' | 'suggestion' | 'warning';

export interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  completion_rate: number;
}

export interface TrendChart {
  calories: number[];
  protein: number[];
  fat: number[];
  carbs: number[];
  dates: string[];
}

export interface AIInsight {
  type: InsightType;
  content: string;
}

export interface NutritionAnalysisResponse {
  period: 'week' | 'month' | 'year';
  summary: NutritionSummary;
  daily_data: DailyNutritionData[];
  trend_chart: TrendChart;
  ai_insights: AIInsight[];
}

// ==================== 计划应用类型 ====================

export interface ApplyPlanResponse {
  plan_id: string;
  is_active: boolean;
  applied_at: string;
  meals_created: number;
}

// ==================== 体重记录类型 ====================

// ==================== 待办事项类型 ====================

export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoCategory = 'feeding' | 'health' | 'grooming' | 'shopping' | 'other';

export interface TodoItem {
  id: string;
  user_id: string;
  pet_id?: string;
  pet_name?: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  is_all_day: boolean;
  is_completed: boolean;
  completed_at?: string;
  priority: TodoPriority;
  category: TodoCategory;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  pet_id?: string;
  due_date: string;
  due_time?: string;
  is_all_day?: boolean;
  priority?: TodoPriority;
  category?: TodoCategory;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  pet_id?: string;
  due_date?: string;
  due_time?: string;
  is_all_day?: boolean;
  priority?: TodoPriority;
  category?: TodoCategory;
}

export interface TodoListResponse {
  total: number;
  items: TodoItem[];
}

// ==================== 体重记录类型 ====================

export interface WeightRecord {
  id: string;
  pet_id: string;
  weight: number;
  recorded_date: string;
  notes?: string;
  created_at?: string;
}

export interface RecordWeightRequest {
  pet_id: string;
  weight: number;
  recorded_date?: string;
  notes?: string;
}

// ==================== 食材库类型 ====================

/** 归属范围：全部 / 仅系统 / 仅自定义 */
export type IngredientScope = 'all' | 'system' | 'custom';

/** 食材营养字段（全部可选） */
export interface IngredientNutrition {
  calories?: number | null;
  carbohydrates?: number | null;
  protein?: number | null;
  fat?: number | null;
  dietary_fiber?: number | null;

  iron?: number | null;
  zinc?: number | null;
  manganese?: number | null;
  magnesium?: number | null;
  sodium?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
  copper?: number | null;
  iodine?: number | null;
  potassium?: number | null;
  selenium?: number | null;

  vitamin_a?: number | null;
  vitamin_d?: number | null;
  vitamin_e?: number | null;
  vitamin_b1?: number | null;

  epa?: number | null;
  dha?: number | null;
  epa_dha?: number | null;

  bone_content?: number | null;
  water?: number | null;
  choline?: number | null;
  taurine?: number | null;
  cholesterol?: number | null;
}

/** 单条食材 */
export interface Ingredient extends IngredientNutrition {
  id: string;
  name: string;
  category: string;
  sub_category: string;
  note?: string | null;
  has_nutrition_data: boolean;
  user_id?: string | null;
  is_system: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

/** 列表响应 */
export interface IngredientListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Ingredient[];
}

/** 分类聚合项 */
export interface IngredientCategoryItem {
  category: string;
  sub_category: string;
  count: number;
}

/** 列表查询参数 */
export interface IngredientListParams {
  keyword?: string;
  category?: string;
  sub_category?: string;
  scope?: IngredientScope;
  limit?: number;
  offset?: number;
}

/** 创建请求（主要字段必填 + 次要可选） */
export interface CreateIngredientRequest extends IngredientNutrition {
  name: string;
  category: string;
  sub_category: string;
  note?: string | null;
  has_nutrition_data?: boolean;
}

/** 更新请求（全部可选） */
export type UpdateIngredientRequest = Partial<CreateIngredientRequest>;
