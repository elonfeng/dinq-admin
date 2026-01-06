/**
 * 用户管理相关类型定义
 */

// 用户信息
export interface AdminUserInfo {
  user_id: string
  email: string
  name: string
  domain: string
  tier: string
  plan: string
  plan_status: string
  credit_balance: number
  created_at: string
}

// 搜索用户请求
export interface SearchUserRequest {
  email?: string
  domain?: string
}

// 更新套餐请求
export interface UpdatePlanRequest {
  user_id: string
  new_plan: string
}

// 充值积分请求
export interface AddCreditsRequest {
  user_id: string
  amount: number
}

// 套餐信息
export interface PlanInfo {
  plan: string
  monthly_credits: number
}

// 套餐显示名称映射
export const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic_monthly: 'Basic',
  pro_monthly: 'Pro',
  plus_monthly: 'Plus',
}
