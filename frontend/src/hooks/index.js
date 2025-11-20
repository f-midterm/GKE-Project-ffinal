/**
 * Hooks Index
 * 
 * Central export point for all custom hooks.
 * 
 * @module hooks
 * 
 * @example
 * import { useAuth, useDebounce } from '@/hooks';
 */

export { useAuth } from './useAuth';
export { useApi, useApiOnMount } from './useApi';
export { useBookingStatus } from './useBookingStatus';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useLocalStorage, useLocalStorageString } from './useLocalStorage';
