import { useContext } from 'react';
import PlanGenerationContext from '../context/PlanGenerationContextValue';

export function usePlanGeneration() {
  const context = useContext(PlanGenerationContext);
  if (!context) {
    throw new Error('usePlanGeneration must be used within a PlanGenerationProvider');
  }
  return context;
}
