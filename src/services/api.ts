/**
 * Axios API client configuration
 * Handles authentication, error handling, and request/response interceptors
 */

import axios from 'axios'
import type { AxiosError } from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.dinq.me/api/v1',
  timeout: 120000, // 120 seconds timeout for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server returned error status code
      const { status, data } = error.response
      const errorData = data as any

      switch (status) {
        case 401:
          // Unauthorized, redirect to login
          console.error('Unauthorized. Please login.')

          break
        case 403:
          // Forbidden
          console.error('Forbidden:', errorData.message)
          break
        case 404:
          // Not found
          console.error('Not found:', errorData.message)
          break
        case 503:
          // Service unavailable
          console.error('Service unavailable:', errorData.message)
          break
        default:
          console.error('API Error:', errorData.message || 'Unknown error')
      }
    } else if (error.request) {
      // Request sent but no response received (network error, timeout)
      console.error('Network error or timeout')
    } else {
      // Request configuration error
      console.error('Request setup error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
