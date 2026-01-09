/**
 * 保留域名管理 API 服务
 */

import apiClient from './api'

export interface ReservedDomain {
  id: number
  domain: string
  reason: string
  created_by: string
  created_at: string
}

export interface ReservedDomainListResponse {
  items: ReservedDomain[]
  total: number
  page: number
  page_size: number
}

export interface BatchAddResponse {
  added: number
  skipped: number
}

export const domainService = {
  /**
   * 获取保留域名列表
   */
  async getList(page = 1, pageSize = 20, keyword = ''): Promise<ReservedDomainListResponse> {
    const response = await apiClient.get('/admin/reserved-domains', {
      params: { page, page_size: pageSize, keyword },
    })
    return response.data?.data || response.data
  },

  /**
   * 添加保留域名
   */
  async add(domain: string, reason = ''): Promise<ReservedDomain> {
    const response = await apiClient.post('/admin/reserved-domains', { domain, reason })
    return response.data?.data || response.data
  },

  /**
   * 批量添加保留域名
   */
  async batchAdd(domains: string[], reason = ''): Promise<BatchAddResponse> {
    const response = await apiClient.post('/admin/reserved-domains/batch', { domains, reason })
    return response.data?.data || response.data
  },

  /**
   * 删除保留域名
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/reserved-domains/${id}`)
  },

  /**
   * 获取默认禁用域名列表
   */
  async getDefaults(): Promise<string[]> {
    const response = await apiClient.get('/admin/reserved-domains/defaults')
    return response.data?.data?.domains || response.data?.domains || []
  },

  /**
   * 检查域名是否被保留
   */
  async check(domain: string): Promise<{ domain: string; reserved: boolean }> {
    const response = await apiClient.get('/admin/reserved-domains/check', {
      params: { domain },
    })
    return response.data?.data || response.data
  },
}
