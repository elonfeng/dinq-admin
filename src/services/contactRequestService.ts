import apiClient from './api'
import type {
  ContactRequest,
  ContactRequestListResult,
  ContactRequestStatus,
} from '@/types/contactRequest'

function normalizeStatus(raw: any): ContactRequestStatus {
  const value = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (value === 'processing' || value === 'resolved') {
    return value
  }
  return 'pending'
}

function normalizeEntry(raw: any): ContactRequest | null {
  if (!raw) return null
  const id = raw.id || raw.ID
  if (!id) return null

  return {
    id: String(id),
    name: raw.name || '',
    affiliation: raw.affiliation || '',
    email: raw.email || '',
    country: raw.country || '',
    jobTitle: raw.job_title || raw.jobTitle || '',
    reason: raw.reason || '',
    details: raw.details || '',
    status: normalizeStatus(raw.status),
    createdAt: raw.created_at || raw.createdAt || '',
    updatedAt: raw.updated_at || raw.updatedAt || '',
  }
}

export const contactRequestService = {
  async list(params?: {
    status?: ContactRequestStatus | 'all'
    limit?: number
    offset?: number
  }): Promise<ContactRequestListResult> {
    const response = await apiClient.get('/contact-requests', {
      params: {
        status: params?.status && params.status !== 'all' ? params.status : undefined,
        limit: params?.limit,
        offset: params?.offset,
      },
    })

    const payload = response.data?.data || response.data || {}
    const itemsSource: any[] = Array.isArray(payload.items)
      ? payload.items
      : payload.data || payload.list || []

    const items = itemsSource
      .map((item) => normalizeEntry(item))
      .filter((item): item is ContactRequest => !!item)

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

  async updateStatus(id: string, status: ContactRequestStatus): Promise<void> {
    await apiClient.post('/contact-requests/' + id + '/status', {
      status,
    })
  },
}
