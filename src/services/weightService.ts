import type { AchievementGenerationRequest } from '@/types/weight'
import apiClient from './api'

export const weightService = {
  /**
   * Generate achievement network with user data and optional weights
   * @param request - Achievement generation request with user_data, social_urls, and optional weights
   * @returns Achievement network response (array of nodes)
   */
  async generateAchievementNetwork(
    request: AchievementGenerationRequest
  ): Promise<any> {
    const response = await apiClient.post<{
      code: number
      data: any
      message: string
    }>(
      '/tool/achievement-network/generate',
      request
    )
    // Backend returns { code, data, message }, extract the data field
    return response.data
  },
}
