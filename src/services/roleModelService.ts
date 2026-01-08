/**
 * Role Model API 服务
 */

import apiClient from './api'
import type {
  RoleModel,
  RoleModelListRequest,
  RoleModelListResponse,
  CreateRoleModelRequest,
  UpdateRoleModelRequest,
} from '@/types/roleModel'

export const roleModelService = {
  /**
   * 获取榜样人物列表
   */
  async list(params: RoleModelListRequest = {}): Promise<RoleModelListResponse> {
    const response = await apiClient.get('/role-models', { params })
    const payload = response.data?.data || response.data || {}
    return {
      items: payload.items || [],
      total: payload.total || 0,
      page: payload.page || 1,
      page_size: payload.page_size || 20,
    }
  },

  /**
   * 获取单个榜样人物
   */
  async get(id: string): Promise<RoleModel> {
    const response = await apiClient.get(`/role-models/${id}`)
    return response.data?.data || response.data
  },

  /**
   * 创建榜样人物
   */
  async create(req: CreateRoleModelRequest): Promise<RoleModel> {
    const response = await apiClient.post('/role-models', req)
    return response.data?.data || response.data
  },

  /**
   * 更新榜样人物
   */
  async update(id: string, req: UpdateRoleModelRequest): Promise<RoleModel> {
    const response = await apiClient.put(`/role-models/${id}`, req)
    return response.data?.data || response.data
  },

  /**
   * 删除榜样人物
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/role-models/${id}`)
  },

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/role-models/categories')
    const payload = response.data?.data || response.data || {}
    return payload.categories || []
  },

  /**
   * 导入榜样人物（CSV/XLSX）
   */
  async import(file: File): Promise<{ message: string; count: number }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/role-models/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const payload = response.data?.data || response.data || {}
    return {
      message: payload.message || 'Import completed',
      count: payload.count || 0,
    }
  },
}
