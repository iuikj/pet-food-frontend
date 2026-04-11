/**
 * 待办事项 API 服务
 */
import apiClient from './client';
import type {
  ApiResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoItem,
  TodoListResponse,
} from './types';

export interface GetTodosParams {
  date_start?: string;
  date_end?: string;
  pet_id?: string;
  is_completed?: boolean;
}

export async function getTodos(
  params?: GetTodosParams
): Promise<ApiResponse<TodoListResponse>> {
  return apiClient.get<any, ApiResponse<TodoListResponse>>('/todos/', { params });
}

export async function createTodo(
  data: CreateTodoRequest
): Promise<ApiResponse<TodoItem>> {
  return apiClient.post<any, ApiResponse<TodoItem>>('/todos/', data);
}

export async function updateTodo(
  id: string,
  data: UpdateTodoRequest
): Promise<ApiResponse<TodoItem>> {
  return apiClient.put<any, ApiResponse<TodoItem>>(`/todos/${id}`, data);
}

export async function deleteTodo(id: string): Promise<ApiResponse<{ todo_id: string }>> {
  return apiClient.delete<any, ApiResponse<{ todo_id: string }>>(`/todos/${id}`);
}

export async function completeTodo(id: string): Promise<ApiResponse<{ todo_id: string; is_completed: boolean; completed_at: string }>> {
  return apiClient.post<any, ApiResponse<any>>(`/todos/${id}/complete`);
}

export async function uncompleteTodo(id: string): Promise<ApiResponse<{ todo_id: string; is_completed: boolean }>> {
  return apiClient.delete<any, ApiResponse<any>>(`/todos/${id}/complete`);
}

export const todosApi = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  completeTodo,
  uncompleteTodo,
};

export default todosApi;
