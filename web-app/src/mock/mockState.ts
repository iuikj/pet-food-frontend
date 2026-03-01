/**
 * 会话内可变状态管理
 * 支持宠物 CRUD、餐食完成等操作的内存持久化
 */
import type { PetResponse } from '../api/types';
import { mockPets } from './data/pets';

class MockState {
  private _pets: PetResponse[];
  private _completedMealIds: Set<string>;

  constructor() {
    // 深拷贝初始数据，避免污染原始 mock 数据
    this._pets = JSON.parse(JSON.stringify(mockPets));
    this._completedMealIds = new Set(['mock-meal-1']); // 早餐默认已完成
  }

  // ===== 宠物管理 =====

  get pets(): PetResponse[] {
    return this._pets;
  }

  addPet(pet: PetResponse): void {
    this._pets.push(pet);
  }

  updatePet(id: string, updates: Partial<PetResponse>): PetResponse | null {
    const idx = this._pets.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this._pets[idx] = { ...this._pets[idx], ...updates, updated_at: new Date().toISOString() };
    return this._pets[idx];
  }

  deletePet(id: string): boolean {
    const idx = this._pets.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this._pets.splice(idx, 1);
    return true;
  }

  getPet(id: string): PetResponse | undefined {
    return this._pets.find((p) => p.id === id);
  }

  // ===== 餐食完成状态 =====

  get completedMealIds(): Set<string> {
    return this._completedMealIds;
  }

  isMealCompleted(id: string): boolean {
    return this._completedMealIds.has(id);
  }

  completeMeal(id: string): void {
    this._completedMealIds.add(id);
  }

  uncompleteMeal(id: string): void {
    this._completedMealIds.delete(id);
  }
}

/** 单例 */
export const mockState = new MockState();
