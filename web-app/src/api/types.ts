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
  calcium: NutrientAmountLike;
  iron: NutrientAmountLike;
  sodium: NutrientAmountLike;
  potassium: NutrientAmountLike;
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
