/**
 * 用户管理 API 服务
 */

import apiClient from './api'
import type {
  AdminUserInfo,
  SearchUserRequest,
  SearchUserResponse,
  UpdatePlanRequest,
  AddCreditsRequest,
  PlanInfo,
} from '@/types/userManagement'

export const userManagementService = {
  /**
   * 搜索用户（可能返回多个结果）
   */
  async searchUser(params: SearchUserRequest): Promise<SearchUserResponse> {
    const response = await apiClient.get('/admin/users/search', { params })
    const payload = response.data?.data || response.data || {}
    return {
      users: payload.users || [],
      count: payload.count || 0,
      message: payload.message,
    }
  },

  /**
   * 更新用户套餐
   */
  async updatePlan(req: UpdatePlanRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/admin/users/update-plan', req)
    const payload = response.data?.data || response.data || {}
    return {
      success: payload.success !== false,
      message: payload.message || '',
    }
  },

  /**
   * 充值积分
   */
  async addCredits(req: AddCreditsRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/admin/users/add-credits', req)
    const payload = response.data?.data || response.data || {}
    return {
      success: payload.success !== false,
      message: payload.message || '',
    }
  },

  /**
   * 获取所有套餐列表
   */
  async getPlans(): Promise<PlanInfo[]> {
    const response = await apiClient.get('/admin/plans')
    const payload = response.data?.data || response.data || {}
    return payload.plans || []
  },
}
