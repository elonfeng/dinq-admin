/**
 * Opening (职位) API 服务
 */

import apiClient from './api'
import type {
  Opening,
  OpeningListParams,
  OpeningListResponse,
  OpeningStatsResponse,
  CreateOpeningRequest,
  UpdateOpeningRequest,
} from '@/types/opening'

export const openingService = {
  /**
   * 获取职位列表
   */
  async list(params: OpeningListParams = {}): Promise<OpeningListResponse['data']> {
    const response = await apiClient.get<OpeningListResponse>('/openings', { params })
    return response.data?.data || { list: [], total: 0, has_more: false }
  },

  /**
   * 获取职位统计
   */
  async getStats(): Promise<OpeningStatsResponse['data']> {
    const response = await apiClient.get<OpeningStatsResponse>('/openings/stats')
    return response.data.data
  },

  /**
   * 获取单个职位
   */
  async getById(id: string): Promise<Opening> {
    const response = await apiClient.get<{ code: number; data: Opening; message: string }>(
      `/openings/${id}`
    )
    return response.data.data
  },

  /**
   * 创建职位
   */
  async create(data: CreateOpeningRequest): Promise<Opening> {
    const response = await apiClient.post<{ code: number; data: Opening; message: string }>(
      '/openings',
      data
    )
    return response.data.data
  },

  /**
   * 更新职位
   */
  async update(id: string, data: UpdateOpeningRequest): Promise<Opening> {
    const response = await apiClient.put<{ code: number; data: Opening; message: string }>(
      `/openings/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * 删除职位
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/openings/${id}`)
  },
}
