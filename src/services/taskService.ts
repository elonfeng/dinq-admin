import type { AsyncTask, TaskStatus } from '@/types/task'
import apiClient from './api'

export const taskService = {
  /**
   * Get task status by ID
   * @param taskId - Task ID
   * @returns Task details with current status
   */
  async getTaskStatus(taskId: string): Promise<AsyncTask> {
    const response = await apiClient.get<AsyncTask>(`/tool/common/api/task/${taskId}/status`)
    return response.data
  },

  /**
   * Get task list with optional filters
   * @param params - Query parameters for filtering
   * @returns List of tasks
   */
  async getTaskList(params?: {
    status?: TaskStatus
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  }): Promise<{ tasks: AsyncTask[]; total: number }> {
    const response = await apiClient.get<{ tasks: AsyncTask[]; total: number }>(
      '/tool/common/api/tasks',
      { params }
    )
    return response.data
  },

  /**
   * Poll task status until completion or timeout
   * @param taskId - Task ID to poll
   * @param intervalMs - Polling interval in milliseconds (default: 2000)
   * @param maxAttempts - Maximum number of polling attempts (default: 150 = 5 minutes)
   * @returns Final task status
   */
  async pollTaskUntilComplete(
    taskId: string,
    intervalMs: number = 2000,
    maxAttempts: number = 150
  ): Promise<AsyncTask> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const task = await this.getTaskStatus(taskId)

      // Check if task is in terminal state
      if (['success', 'failure', 'partial_failure'].includes(task.status)) {
        return task
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
      attempts++
    }

    // Timeout - return last known status
    const finalTask = await this.getTaskStatus(taskId)
    throw new Error(
      `任务轮询超时 (${maxAttempts * intervalMs}ms)，最后状态: ${finalTask.status}`
    )
  },

  /**
   * Retry a failed task with same parameters
   * @param taskId - Original task ID
   * @returns New task ID
   */
  async retryTask(taskId: string): Promise<{ task_id: string }> {
    const response = await apiClient.post<{ task_id: string }>(`/tool/common/api/task/${taskId}/retry`)
    return response.data
  },
}
