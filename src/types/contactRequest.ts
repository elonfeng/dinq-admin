export type ContactRequestStatus = 'pending' | 'processing' | 'resolved'

export interface ContactRequest {
  id: string
  name: string
  affiliation: string
  email: string
  country: string
  jobTitle: string
  reason: string
  details: string
  status: ContactRequestStatus
  createdAt: string
  updatedAt: string
}

export interface ContactRequestListResult {
  items: ContactRequest[]
  total: number
  limit: number
  offset: number
}
