import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginCredentials } from '@/types/auth'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import apiClient from '@/services/api'

const STORAGE_KEY_AUTH = 'dinq_auth_state'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  token: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const username = ref<string | null>(null)
  const token = ref<string | null>(null)

  // Computed
  const isLoggedIn = computed(() => isAuthenticated.value && !!token.value)

  // Actions
  async function login(credentials: LoginCredentials): Promise<boolean> {
    try {
      // 调用后端登录接口
      const response = await apiClient.post<{
        code: number
        message: string
        data: {
          token: string
          user: { email: string; name: string }
        }
      }>('/auth/login', {
        email: credentials.username, // 使用邮箱登录
        password: credentials.password,
      })

      // 检查返回码
      if (response.data.code !== 0) {
        console.error('Login failed:', response.data.message)
        return false
      }

      // 保存 token 和用户信息
      token.value = response.data.data.token
      username.value = response.data.data.user.name || response.data.data.user.email
      isAuthenticated.value = true

      // 保存 token 到 localStorage
      localStorage.setItem('auth_token', response.data.data.token)
      saveAuthState()

      return true
    } catch (error: any) {
      console.error('Login failed:', error)
      return false
    }
  }

  function logout() {
    isAuthenticated.value = false
    username.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    saveAuthState()
  }

  function saveAuthState() {
    const state: AuthState = {
      isAuthenticated: isAuthenticated.value,
      username: username.value,
      token: token.value,
    }
    saveToStorage(STORAGE_KEY_AUTH, state)
  }

  function loadAuthState() {
    const saved = loadFromStorage<AuthState | null>(STORAGE_KEY_AUTH, null)
    if (saved) {
      isAuthenticated.value = saved.isAuthenticated || false
      username.value = saved.username || null
      token.value = saved.token || null

      // 如果有 token，也保存到 localStorage（给 api.ts 用）
      if (token.value) {
        localStorage.setItem('auth_token', token.value)
      }
    }
  }

  // 初始化从localStorage加载
  loadAuthState()

  return {
    // State
    isAuthenticated,
    username,
    token,
    // Computed
    isLoggedIn,
    // Actions
    login,
    logout,
  }
})
