/**
 * 邀请码 API 服务
 */

import apiClient from './api'
import type {
  InvitationCodeWithUsage,
  InvitationCodeListRequest,
  InvitationCodeListResponse,
  BatchGenerateRequest,
  BatchGenerateResponse,
  SendInvitationEmailRequest,
  SendInvitationEmailResponse,
  InvitationCodeType,
  InvitationCodeStatus,
  InviteCodeUsersResponse,
  InviteCodeStatsResponse,
  InviteCodeUser,
} from '@/types/invitationCode'

function normalizeCode(raw: any): InvitationCodeWithUsage | null {
  if (!raw) return null
  const id = raw.id || raw.ID
  if (!id) return null

  return {
    id: String(id),
    code: raw.code || '',
    type: (raw.type as InvitationCodeType) || 'single',
    status: (raw.status as InvitationCodeStatus) || 'active',
    source: raw.source || '',
    batchId: raw.batch_id || raw.batchId || '',
    notes: raw.notes || undefined,
    createdBy: raw.created_by || raw.createdBy || '',
    usedBy: raw.used_by || raw.usedBy || undefined,
    usedAt: raw.used_at || raw.usedAt || undefined,
    expiresAt: raw.expires_at || raw.expiresAt || undefined,
    createdAt: raw.created_at || raw.createdAt || '',
    updatedAt: raw.updated_at || raw.updatedAt || '',
    isUsed: raw.is_used || raw.isUsed || false,
    usedCount: raw.used_count || raw.usedCount || 0,
  }
}

export const invitationCodeService = {
  /**
   * 获取邀请码列表
   */
  async list(params?: InvitationCodeListRequest): Promise<InvitationCodeListResponse> {
    const response = await apiClient.get('/invitation-codes', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        source: params?.source || undefined,
        batch_id: params?.batchId || undefined,
      },
    })

    // API 返回 { code, data, message }，实际数据在 data 里
    const payload = response.data?.data || response.data || {}
    const codesSource: any[] = Array.isArray(payload.codes) ? payload.codes : []

    const codes = codesSource
      .map((item) => normalizeCode(item))
      .filter((item): item is InvitationCodeWithUsage => !!item)

    return {
      success: payload.success !== false,
      total: typeof payload.total === 'number' ? payload.total : codes.length,
      page: typeof payload.page === 'number' ? payload.page : params?.page || 1,
      limit: typeof payload.limit === 'number' ? payload.limit : params?.limit || 20,
      codes,
    }
  },

  /**
   * 批量生成邀请码
   */
  async batchGenerate(req: BatchGenerateRequest): Promise<BatchGenerateResponse> {
    const response = await apiClient.post('/invitation-codes/generate', {
      count: req.count,
      source: req.source,
      type: req.type || 'single',
      expires_in_day: req.expiresInDay,
      notes: req.notes,
    })

    const payload = response.data?.data || response.data || {}
    return {
      success: payload.success !== false,
      batchId: payload.batch_id || payload.batchId || '',
      count: payload.count || 0,
      codes: Array.isArray(payload.codes) ? payload.codes : [],
      message: payload.message || '',
    }
  },

  /**
   * 验证邀请码
   */
  async verify(code: string): Promise<{ valid: boolean; code: string }> {
    const response = await apiClient.get('/invitation-codes/verify', {
      params: { code },
    })
    return response.data?.data || response.data
  },

  /**
   * 获取邀请码详情
   */
  async getByCode(code: string): Promise<InvitationCodeWithUsage | null> {
    const response = await apiClient.get(`/invitation-codes/${code}`)
    return normalizeCode(response.data?.data || response.data)
  },

  /**
   * 发送邀请码邮件
   */
  async sendInvitationEmail(req: SendInvitationEmailRequest): Promise<SendInvitationEmailResponse> {
    const response = await apiClient.post('/invitation-codes/send-email', {
      email: req.email,
      full_name: req.fullName,
    })
    const payload = response.data?.data || response.data || {}
    return {
      success: payload.success !== false,
      code: payload.code || '',
      message: payload.message || '',
    }
  },

  /**
   * 更新邀请码状态（启用/禁用）
   */
  async updateStatus(code: string, status: InvitationCodeStatus): Promise<void> {
    await apiClient.post('/invitation-codes/update-status', {
      code,
      status,
    })
  },

  /**
   * 获取使用某邀请码的用户列表
   */
  async getCodeUsers(code: string): Promise<InviteCodeUsersResponse> {
    const response = await apiClient.get('/invitation-codes/users', {
      params: { code },
    })
    const payload = response.data?.data || response.data || {}
    return {
      success: payload.success !== false,
      code: payload.code || code,
      count: payload.count || 0,
      users: (payload.users || []).map((u: any) => ({
        id: u.id || '',
        email: u.email || '',
        name: u.name || '',
        createdAt: u.created_at || u.createdAt || '',
      })) as InviteCodeUser[],
    }
  },

  /**
   * 获取邀请码使用统计
   */
  async getCodeStats(code: string): Promise<InviteCodeStatsResponse> {
    const response = await apiClient.get('/invitation-codes/stats', {
      params: { code },
    })
    const payload = response.data?.data || response.data || {}
    return {
      success: payload.success !== false,
      code: payload.code || code,
      usedCount: payload.used_count || payload.usedCount || 0,
    }
  },
}
