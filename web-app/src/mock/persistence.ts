import type { PetResponse, UserInfo } from '../api/types';
import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage';

export function readMockPets(fallback: PetResponse[]): PetResponse[] {
  return readJSON(STORAGE_KEYS.mockPets, fallback);
}

export function writeMockPets(pets: PetResponse[]): void {
  writeJSON(STORAGE_KEYS.mockPets, pets);
}

export function readMockUser(fallback: UserInfo): UserInfo {
  return readJSON(STORAGE_KEYS.mockUser, fallback);
}

export function writeMockUser(user: UserInfo): void {
  writeJSON(STORAGE_KEYS.mockUser, user);
}

export function isLegacySeedPets(pets: PetResponse[]): boolean {
  if (pets.length !== 2) {
    return false;
  }

  const firstPet = pets.find((pet) => pet.id === 'mock-pet-001');
  const secondPet = pets.find((pet) => pet.id === 'mock-pet-002');

  return firstPet?.name === 'Cooper' && secondPet?.name === 'Luna';
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read file as data URL'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file as data URL'));
    };

    reader.readAsDataURL(file);
  });
}
