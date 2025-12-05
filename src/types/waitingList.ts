export type WaitingListStatus = 'pending' | 'approved' | 'rejected'

export interface WaitingListEntry {
  id: string
  fullName: string
  emailAddress: string
  phoneNumber?: string | null
  country: string
  institutionOrganization: string
  schoolUniversity?: string | null
  jobTitlePosition: string
  status: WaitingListStatus
  createdAt: string
  updatedAt: string
}

export interface WaitingListListResult {
  items: WaitingListEntry[]
  total: number
  limit: number
  offset: number
}
