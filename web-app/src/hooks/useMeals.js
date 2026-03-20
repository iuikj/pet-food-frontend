import { useContext } from 'react';
import MealContext from '../context/MealContextValue';

export function useMeals() {
    const context = useContext(MealContext);
    if (!context) {
        throw new Error('useMeals must be used within a MealProvider');
    }
    return context;
}
