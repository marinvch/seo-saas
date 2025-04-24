import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Type-safe Redux hooks for use throughout the application.
 * These hooks are pre-typed with the correct state and dispatch types.
 */

/**
 * Use this hook instead of the standard useDispatch for better TypeScript integration
 * This custom hook ensures proper typing for thunks and async actions
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Use this hook instead of the standard useSelector for better TypeScript integration
 * This custom hook provides proper typing for state selectors
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;