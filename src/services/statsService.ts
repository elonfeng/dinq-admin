/**
 * 统计 API 服务
 */

import apiClient from './api'
import type {
  UserStats,
  RecentUsersResponse,
  UserDetailInfo,
  QueryStats,
  TopUsersResponse,
  QueryListResponse,
} from '@/types/stats'

export const statsService = {
  // ========== 用户统计 ==========

  /**
   * 获取用户统计概览
   */
  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/admin/users/stats')
    return response.data?.data || response.data
  },

  /**
   * 获取最新注册用户列表
   */
  async getRecentUsers(page = 1, pageSize = 20): Promise<RecentUsersResponse> {
    const response = await apiClient.get('/admin/users/recent', {
      params: { page, page_size: pageSize },
    })
    return response.data?.data || response.data
  },

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string): Promise<UserDetailInfo> {
    const response = await apiClient.get(`/admin/users/${userId}/detail`)
    return response.data?.data || response.data
  },

  // ========== Query 统计 ==========

  /**
   * 获取 Query 总体统计
   */
  async getQueryStats(): Promise<QueryStats> {
    const response = await apiClient.get('/admin/queries/stats')
    return response.data?.data || response.data
  },

  /**
   * 获取月度 Query 前十用户
   */
  async getTopUsers(month?: string): Promise<TopUsersResponse> {
    const response = await apiClient.get('/admin/queries/top-users', {
      params: month ? { month } : {},
    })
    return response.data?.data || response.data
  },

  /**
   * 获取查询历史列表
   */
  async getQueryList(
    userId?: string,
    page = 1,
    pageSize = 20
  ): Promise<QueryListResponse> {
    const response = await apiClient.get('/admin/queries/list', {
      params: { user_id: userId, page, page_size: pageSize },
    })
    return response.data?.data || response.data
  },
}
