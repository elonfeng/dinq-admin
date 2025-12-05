import apiClient from './api'
import type {
  PendingVerificationResult,
  VerificationRecord,
  VerificationReviewPayload,
  VerificationStatus,
  VerificationType,
} from '@/types/verification'

function normalizeType(rawType: any): VerificationType {
  if (!rawType) {
    return 'career'
  }
  return String(rawType).toLowerCase() as VerificationType
}

function normalizeStatus(rawStatus: any): VerificationStatus {
  if (!rawStatus) {
    return 'pending'
  }
  return String(rawStatus).toLowerCase() as VerificationStatus
}

function normalizeRecord(raw: any): VerificationRecord | null {
  if (!raw) return null

  const verificationId =
    raw.verification_id || raw.verificationId || raw.id || raw.uuid || raw.record_id

  if (!verificationId) {
    return null
  }

  return {
    verificationId,
    userId: raw.user_id || raw.userId || raw.user?.id,
    user: {
      id: raw.user?.id || raw.user_id,
      username: raw.user?.username || raw.username,
      name: raw.user?.name || raw.user_name || raw.full_name,
      email: raw.user?.email || raw.user_email,
      avatar: raw.user?.avatar || raw.avatar_url,
    },
    type: normalizeType(raw.type || raw.verification_type || raw.category),
    status: normalizeStatus(raw.status),
    submittedAt: raw.submitted_at || raw.created_at || raw.updated_at,
    documents: raw.documents || raw.document_urls || raw.evidence_files || [],
    data: raw.data || raw.details || raw.payload || {},
    raw,
  }
}

export const verificationService = {
  async getVerifications(params?: { status?: string }): Promise<PendingVerificationResult> {
    const response = await apiClient.get('/admin/verifications', { params })
    const payload = response.data

    const recordsSource = Array.isArray(payload)
      ? payload
      : payload?.items || payload?.data || payload?.verifications || []

    const items = (recordsSource as any[])
      .map((record) => normalizeRecord(record))
      .filter((record): record is VerificationRecord => !!record)

    const total =
      typeof payload?.total === 'number'
        ? payload.total
        : Array.isArray(payload)
          ? payload.length
          : (recordsSource as any[]).length

    return {
      items,
      total,
    }
  },

  async reviewVerification(payload: VerificationReviewPayload): Promise<void> {
    await apiClient.post('/admin/verifications/review', {
      verification_id: payload.verificationId,
      status: payload.status,
      reviewer_notes: payload.reviewerNotes,
    })
  },
}
