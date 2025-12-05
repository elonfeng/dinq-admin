/**
 * Async task types
 * Represents dinq_tools async task records from /tool/common/api/tasks/{task_id}/status
 */

import type { AchievementNetwork } from './weight'

export type TaskStatus =
  | 'queued' // Submitted, waiting for processing
  | 'processing' // Currently executing
  | 'success' // All succeeded
  | 'partial_failure' // Some succeeded, some failed
  | 'failure' // All failed

export interface TaskFilter {
  status?: TaskStatus
  start_date?: string
  end_date?: string
}

export interface PlatformResult {
  status: 'success' | 'failure'
  data?: Record<string, any>
  error?: string
}

export interface AchievementResult {
  status: 'success' | 'failure'
  data?: AchievementNetwork
  error?: string
}

export interface TaskResult {
  status: 'success' | 'partial_failure'
  result: {
    github?: PlatformResult
    linkedin?: PlatformResult
    twitter?: PlatformResult
    scholar?: PlatformResult
    achievement?: AchievementResult
  }
}

export interface AsyncTask {
  task_id: string // Task ID (UUID)
  status: TaskStatus // Task status
  progress_pct: number // Progress percentage (0-100)
  progress_steps: string[] // Progress steps (e.g., "Generating GitHub card")
  created_at: string // Creation time (ISO 8601)
  updated_at: string // Update time (ISO 8601)
  completed_at: string | null // Completion time (ISO 8601), null if not completed

  error: any | null // Error info (on failure)

  // Request parameters (used for retry and display)
  request_params: {
    user_data?: Record<string, any>
    social_urls?: Record<string, string>
    platforms?: string[]
    mode?: string
    include_achievement_network?: boolean
    weights?: Record<string, any>
    [key: string]: any
  }

  // Platform results (merged at top level by backend)
  github?: PlatformResult
  linkedin?: PlatformResult
  twitter?: PlatformResult
  youtube?: PlatformResult
  scholar?: PlatformResult
  huggingface?: PlatformResult
  openreview?: PlatformResult
  achievement?: any[] | AchievementResult
}

export interface TestConfig {
  id: string // Test configuration ID
  name: string // Test name, e.g. "Test User A"
  created_at: string // Creation time (ISO 8601)

  // Test user data
  user_data: {
    name: string // User name (required)
    email?: string // Email
    bio?: string // Bio
  }

  // Social URLs
  social_urls: {
    github?: string // GitHub URL
    huggingface?: string // HuggingFace URL
    twitter?: string // Twitter URL
    scholar?: string // Google Scholar URL
    linkedin?: string // LinkedIn URL
  }

  // Weight configuration used
  weight_config_id?: string // Associated WeightConfig ID
  custom_weights?: any // Or use custom weights directly

  // Test result (cached)
  result?: AchievementNetwork
  result_timestamp?: string // Result generation time
}
