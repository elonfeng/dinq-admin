export type VerificationType = 'career' | 'education' | 'social' | string

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | string

export interface VerificationUserSummary {
  id?: string
  username?: string
  name?: string
  email?: string
  avatar?: string
}

export interface VerificationRecord {
  verificationId: string
  user?: VerificationUserSummary
  userId?: string
  type: VerificationType
  status: VerificationStatus
  submittedAt?: string
  documents: string[]
  data: Record<string, any>
  raw?: Record<string, any>
}

export interface PendingVerificationResult {
  items: VerificationRecord[]
  total: number
}

export interface VerificationReviewPayload {
  verificationId: string
  status: 'approved' | 'rejected'
  reviewerNotes?: string
}
