import apiClient from './api'
import type {
  WaitingListEntry,
  WaitingListListResult,
  WaitingListStatus,
} from '@/types/waitingList'

function normalizeStatus(raw: any): WaitingListStatus {
  const value = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (value === 'approved' || value === 'rejected') {
    return value
  }
  return 'pending'
}

function normalizeEntry(raw: any): WaitingListEntry | null {
  if (!raw) return null
  const id = raw.id || raw.ID
  if (!id) return null

  return {
    id: String(id),
    fullName: raw.full_name || raw.fullName || raw.name || '',
    emailAddress: raw.email_address || raw.emailAddress || raw.email || '',
    phoneNumber: raw.phone_number ?? raw.phoneNumber ?? null,
    country: raw.country || '',
    institutionOrganization:
      raw.institution_organization || raw.institutionOrganization || raw.organization || '',
    schoolUniversity: raw.school_university ?? raw.schoolUniversity ?? null,
    jobTitlePosition: raw.job_title_position || raw.jobTitlePosition || '',
    status: normalizeStatus(raw.status),
    createdAt: raw.created_at || raw.createdAt || '',
    updatedAt: raw.updated_at || raw.updatedAt || '',
  }
}

export const waitingListService = {
  async list(params?: {
    status?: WaitingListStatus | 'all'
    limit?: number
    offset?: number
  }): Promise<WaitingListListResult> {
    const response = await apiClient.get('/waiting-list', {
      params: {
        status: params?.status && params.status !== 'all' ? params.status : undefined,
        limit: params?.limit,
        offset: params?.offset,
      },
    })

    const payload = response.data || {}
    const itemsSource: any[] = Array.isArray(payload.items)
      ? payload.items
      : payload.data || payload.list || []

    const items = itemsSource
      .map((item) => normalizeEntry(item))
      .filter((item): item is WaitingListEntry => !!item)

    return {
      items,
      total:
        typeof payload.total === 'number'
          ? payload.total
          : Array.isArray(payload.items)
            ? payload.items.length
            : items.length,
      limit: typeof payload.limit === 'number' ? payload.limit : params?.limit ?? 20,
      offset: typeof payload.offset === 'number' ? payload.offset : params?.offset ?? 0,
    }
  },

  async updateStatus(emailAddress: string, status: WaitingListStatus): Promise<void> {
    await apiClient.post('/waiting-list/update-status', {
      email_address: emailAddress,
      status,
    })
  },
}
