/**
 * 统计相关类型定义
 */

// ========== 用户统计 ==========

// 用户统计概览
export interface UserStats {
  total_users: number
  today_new_users: number
  this_week_new_users: number
  this_month_new_users: number
  // 按流程状态统计
  init_users: number
  domain_users: number
  resume_users: number
  success_users: number
  // 按登录方式统计
  email_users: number
  google_users: number
  github_users: number
}

// 最新注册用户信息
export interface RecentUserInfo {
  user_id: string
  email: string
  name: string
  domain: string
  tier: string
  flow_status: string
  auth_provider: string
  credit_balance: number
  created_at: string
}

// 最新用户列表响应
export interface RecentUsersResponse {
  items: RecentUserInfo[]
  total: number
  page: number
  page_size: number
}

// 用户详情
export interface UserDetailInfo {
  user_id: string
  email: string
  name: string
  domain: string
  tier: string
  flow_status: string
  auth_provider: string
  plan: string
  plan_status: string
  credit_balance: number
  position: string
  company: string
  school: string
  location: string
  avatar_url: string
  created_at: string
}

// ========== Query 统计 ==========

// Query 总体统计
export interface QueryStats {
  total_queries: number
  today_queries: number
  this_month_queries: number
}

// 前十用户项
export interface TopUserItem {
  user_id: string
  query_count: number
}

// 前十用户响应
export interface TopUsersResponse {
  month: string
  items: TopUserItem[]
}

// 查询历史项
export interface QueryItem {
  id: number
  user_id: string
  query: string
  result_count: number | null
  duration_ms: number | null
  created_at: string
}

// 查询历史列表响应
export interface QueryListResponse {
  items: QueryItem[]
  total: number
  page: number
  page_size: number
}

// 套餐显示名称映射
export const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic_monthly: 'Basic',
  pro_monthly: 'Pro',
  plus_monthly: 'Plus',
}

// 流程状态显示名称映射
export const FLOW_STATUS_LABELS: Record<string, string> = {
  init: '仅注册',
  domain: '已申请域名',
  resume: '分析简历',
  success: '生成成功',
}

// 登录方式显示名称映射
export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  email: '邮箱',
  google: 'Google',
  github: 'GitHub',
}
