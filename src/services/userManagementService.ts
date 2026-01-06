/**
 * 用户管理 API 服务
 */

import apiClient from './api'
import type {
  AdminUserInfo,
  SearchUserRequest,
  UpdatePlanRequest,
  AddCreditsRequest,
  PlanInfo,
} from '@/types/userManagement'

export const userManagementService = {
  /**
   * 搜索用户
   */
  async searchUser(params: SearchUserRequest): Promise<AdminUserInfo | null> {
    const response = await apiClient.get('/admin/users/search', { params })
    return response.data?.data || response.data || null
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
