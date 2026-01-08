/**
 * Role Model 类型定义
 */

export interface RoleModel {
  id: string
  name: string
  category: string
  photo: string
  school: string
  social_media: Record<string, string> | null
  brief: string
  highlight_brief: string
  data: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface RoleModelListRequest {
  category?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface RoleModelListResponse {
  items: RoleModel[]
  total: number
  page: number
  page_size: number
}

export interface CreateRoleModelRequest {
  name: string
  category: string
  photo?: string
  school?: string
  social_media?: Record<string, string>
  brief?: string
  highlight_brief?: string
  data?: Record<string, any>
}

export interface UpdateRoleModelRequest {
  name?: string
  category?: string
  photo?: string
  school?: string
  social_media?: Record<string, string>
  brief?: string
  highlight_brief?: string
  data?: Record<string, any>
}

export interface CategoriesResponse {
  categories: string[]
}
