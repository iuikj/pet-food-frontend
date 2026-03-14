import { useContext } from 'react';
import PetContext from '../context/PetContextValue';

export function usePets() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets must be used within a PetProvider');
  }
  return context;
}
