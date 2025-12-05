/**
 * Notification Service
 * Handles notification-related API calls
 */

import apiClient from './api'

export interface User {
  id: string
  email: string
  name: string
  provider: string
  provider_id: string
  email_verified: boolean
  created_at: string
}

export interface NotificationTemplate {
  id: string
  type: string
  title: string
  content_template?: string
  priority: number
  enable_push: boolean
  enable_websocket: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  description?: string
}

export interface BatchSendRequest {
  user_ids: string[] // 空数组表示发送给所有用户
  template_type: string // 模板类型
  template_vars: Record<string, string> // 模板变量
  metadata?: Record<string, any>
}

export interface BatchSendResponse {
  code: number
  data: {
    success_count: number
    total_count: number
    message: string
  }
}

class NotificationService {
  /**
   * 获取所有用户列表
   * GET /admin/users → Gateway
   */
  async getAllUsers(
    limit = 100,
    offset = 0,
    search = ''
  ): Promise<{ users: User[]; total: number }> {
    const response = await apiClient.get<{ users: User[]; total: number }>('/admin/users', {
      params: { limit, offset, search },
    })
    return response.data
  }

  /**
   * 获取通知模板列表
   * GET /api/admin/notification-templates → Gateway → Message
   */
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const response = await apiClient.get<{ templates: NotificationTemplate[] }>(
      '/api/admin/notification-templates'
    )
    return response.data.templates
  }

  /**
   * 批量发送通知
   * POST /api/admin/notifications/batch-send → Gateway → Message
   */
  async batchSendNotification(req: BatchSendRequest): Promise<BatchSendResponse> {
    const response = await apiClient.post<BatchSendResponse>(
      '/api/admin/notifications/batch-send',
      req
    )
    return response.data
  }
}

export default new NotificationService()
