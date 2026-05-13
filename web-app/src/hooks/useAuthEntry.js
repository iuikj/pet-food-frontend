import { useContext } from 'react';
import AuthEntryContext from '../context/AuthEntryContextValue';

export function useAuthEntry() {
    const value = useContext(AuthEntryContext);
    if (!value) {
        throw new Error('useAuthEntry must be used within AuthEntryProvider');
    }
    return value;
}
