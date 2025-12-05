/**
 * LocalStorage wrapper utilities
 * Provides type-safe localStorage access with error handling
 */

import type { WeightConfig } from '@/types/weight'
import type { TestConfig } from '@/types/task'
import type { UserPreferences } from '@/types/api'

export const STORAGE_KEYS = {
  WEIGHT_CONFIGS: 'dinq_admin_weight_configs',
  TEST_CONFIGS: 'dinq_admin_test_configs',
  USER_PREFERENCES: 'dinq_admin_user_preferences',
  CURRENT_THEME: 'dinq_admin_current_theme',
  AUTH_TOKEN: 'auth_token',
} as const

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Failed to save to localStorage (key: ${key}):`, error)
  }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(key)
    if (serialized === null) {
      return defaultValue
    }
    return JSON.parse(serialized) as T
  } catch (error) {
    console.error(`Failed to load from localStorage (key: ${key}):`, error)
    return defaultValue
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove from localStorage (key: ${key}):`, error)
  }
}

/**
 * Clear all localStorage data
 */
export function clearStorage(): void {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

// Specific storage utilities

export function saveWeightConfigs(configs: WeightConfig[]): void {
  saveToStorage(STORAGE_KEYS.WEIGHT_CONFIGS, configs)
}

export function loadWeightConfigs(): WeightConfig[] {
  return loadFromStorage<WeightConfig[]>(STORAGE_KEYS.WEIGHT_CONFIGS, [])
}

export function saveTestConfigs(configs: TestConfig[]): void {
  saveToStorage(STORAGE_KEYS.TEST_CONFIGS, configs)
}

export function loadTestConfigs(): TestConfig[] {
  return loadFromStorage<TestConfig[]>(STORAGE_KEYS.TEST_CONFIGS, [])
}

export function saveUserPreferences(preferences: UserPreferences): void {
  saveToStorage(STORAGE_KEYS.USER_PREFERENCES, preferences)
}

export function loadUserPreferences(): UserPreferences | null {
  const defaultPrefs: UserPreferences = {
    theme: {
      mode: 'light',
      autoSwitch: true,
    },
    monitor: {
      enabled: true,
      interval: 5000,
      retryOnError: true,
    },
    language: 'zh-CN',
  }
  return loadFromStorage<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, defaultPrefs)
}

export function saveCurrentTheme(theme: 'light' | 'dark'): void {
  saveToStorage(STORAGE_KEYS.CURRENT_THEME, theme)
}

export function loadCurrentTheme(): 'light' | 'dark' {
  return loadFromStorage<'light' | 'dark'>(STORAGE_KEYS.CURRENT_THEME, 'light')
}
