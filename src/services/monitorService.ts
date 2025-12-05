/**
 * Monitor service
 * Handles API calls for system monitoring
 */

import apiClient from './api'
import type { MonitorMetrics } from '@/types/monitor'

export const monitorService = {
  /**
   * Get queue status and monitoring metrics
   * @returns Promise with MonitorMetrics
   */
  async getQueueStatus(): Promise<MonitorMetrics> {
    const response = await apiClient.get<MonitorMetrics>('/tool/common/api/queue/status')
    return response.data
  },
}
