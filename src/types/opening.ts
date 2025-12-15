/**
 * Opening (职位) 相关类型定义
 */

export interface OpeningTag {
  label: string
  type: 'primary' | 'secondary' | 'outline'
}

export interface Opening {
  id: string
  position: string
  company: string
  company_icon?: string
  tags: OpeningTag[]
  location: string
  description: string
  email?: string
  author_avatar?: string
  author_name?: string
  user_url?: string
  update_time?: string
  source?: 'linkedin' | 'twitter' | string
  source_url?: string
  type: 'graduate' | 'internship'
  created_at?: string
}

export interface OpeningListParams {
  page?: number
  page_size?: number
  type?: 'all' | 'graduate' | 'internship'
  time_range?: 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last60days'
  locations?: string
  sort_order?: 'asc' | 'desc'
}

export interface OpeningListResponse {
  code: number
  data: {
    list: Opening[]
    total: number
    has_more: boolean
  }
  message: string
}

export interface OpeningStatsResponse {
  code: number
  data: {
    total: number
    graduate: number
    internship: number
    last24Hours: number
    last7Days: number
    byLocation: Record<string, number>
  }
  message: string
}

export interface CreateOpeningRequest {
  position: string
  company: string
  company_icon?: string
  tags?: OpeningTag[]
  location: string
  description: string
  email?: string
  author_avatar?: string
  author_name?: string
  user_url?: string
  source?: string
  source_url?: string
  type: 'graduate' | 'internship'
}

export interface UpdateOpeningRequest {
  position?: string
  company?: string
  company_icon?: string
  tags?: OpeningTag[]
  location?: string
  description?: string
  email?: string
  author_avatar?: string
  author_name?: string
  user_url?: string
  source?: string
  source_url?: string
  type?: 'graduate' | 'internship'
}
