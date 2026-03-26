import type { PetResponse } from '../api/types';
import { mockPets } from './data/pets';
import { mockPlanResult } from './data/plans';
import { isLegacySeedPets, readMockPets, writeMockPets } from './persistence';

class MockState {
  private _pets: PetResponse[];
  private _completedMealIds: Set<string>;
  private _plans: any[];

  constructor() {
    const storedPets = readMockPets(mockPets);
    const initialPets = isLegacySeedPets(storedPets) ? mockPets : storedPets;

    this._pets = JSON.parse(JSON.stringify(initialPets));
    this._completedMealIds = new Set(['mock-meal-1']);
    this._plans = [JSON.parse(JSON.stringify(mockPlanResult))];

    if (initialPets !== storedPets) {
      this.persistPets();
    }
  }

  private persistPets(): void {
    writeMockPets(this._pets);
  }

  get pets(): PetResponse[] {
    return this._pets;
  }

  addPet(pet: PetResponse): void {
    this._pets.push(pet);
    this.persistPets();
  }

  updatePet(id: string, updates: Partial<PetResponse>): PetResponse | null {
    const index = this._pets.findIndex((pet) => pet.id === id);
    if (index === -1) {
      return null;
    }

    this._pets[index] = {
      ...this._pets[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistPets();
    return this._pets[index];
  }

  deletePet(id: string): boolean {
    const index = this._pets.findIndex((pet) => pet.id === id);
    if (index === -1) {
      return false;
    }

    this._pets.splice(index, 1);
    this.persistPets();
    return true;
  }

  getPet(id: string): PetResponse | undefined {
    return this._pets.find((pet) => pet.id === id);
  }

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

  get plans(): any[] {
    return this._plans;
  }

  addPlan(plan: any): void {
    if (this._plans.some((item) => item.id === plan.id)) {
      return;
    }

    this._plans.unshift(plan);
  }

  deletePlan(id: string): boolean {
    const index = this._plans.findIndex((plan) => plan.id === id);
    if (index === -1) {
      return false;
    }

    this._plans.splice(index, 1);
    return true;
  }

  getPlan(id: string): any | undefined {
    return this._plans.find((plan) => plan.id === id);
  }
}

export const mockState = new MockState();
