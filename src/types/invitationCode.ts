/**
 * 邀请码相关类型定义
 */

export type InvitationCodeType = 'single' | 'multi'
export type InvitationCodeStatus = 'active' | 'disabled'

export interface InvitationCode {
  id: string
  code: string
  type: InvitationCodeType
  status: InvitationCodeStatus
  source: string
  batchId: string
  notes?: string
  createdBy: string
  usedBy?: string
  usedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface InvitationCodeWithUsage extends InvitationCode {
  isUsed: boolean
  usedCount: number
}

export interface InvitationCodeListRequest {
  page?: number
  limit?: number
  source?: string
  batchId?: string
}

export interface InvitationCodeListResponse {
  success: boolean
  total: number
  page: number
  limit: number
  codes: InvitationCodeWithUsage[]
}

export interface BatchGenerateRequest {
  count: number
  source: string
  type?: InvitationCodeType
  expiresInDay?: number
  notes?: string
}

export interface BatchGenerateResponse {
  success: boolean
  batchId: string
  count: number
  codes: string[]
  message: string
}

export interface SendInvitationEmailRequest {
  email: string
  fullName?: string
}

export interface SendInvitationEmailResponse {
  success: boolean
  code: string
  message: string
}

export interface UpdateStatusRequest {
  code: string
  status: InvitationCodeStatus
}

export interface InviteCodeUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface InviteCodeUsersResponse {
  success: boolean
  code: string
  count: number
  users: InviteCodeUser[]
}

export interface InviteCodeStatsResponse {
  success: boolean
  code: string
  usedCount: number
}
