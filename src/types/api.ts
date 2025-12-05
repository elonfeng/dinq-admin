/**
 * API response types
 * Common API response formats
 */

export interface ApiResponse<T = any> {
  code: number // 0=success, others=error code
  message: string // Response message
  data?: T // Response data
  details?: Record<string, any> // Error details (optional)
}

export interface AsyncTaskSubmitResponse {
  task_id: string
  message: string
}

export interface ThemeConfig {
  mode: 'light' | 'dark' // Theme mode
  primaryColor?: string // Primary color (optional)
  autoSwitch?: boolean // Auto switch based on system
}

export interface UserPreferences {
  theme: ThemeConfig
  monitor: {
    enabled: boolean
    interval: number
    retryOnError: boolean
  }
  language: 'zh-CN' | 'en-US' // Language (future extension)
}
