/**
 * Monitor store
 * Manages monitoring data state with auto-refresh and error handling
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { monitorService } from '@/services/monitorService'
import type { MonitorMetrics, MonitorRefreshConfig } from '@/types/monitor'

export const useMonitorStore = defineStore('monitor', () => {
  // State
  const metrics = ref<MonitorMetrics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // Refresh configuration
  const refreshConfig = ref<MonitorRefreshConfig>({
    enabled: true,
    interval: 5000, // 5 seconds
    retryOnError: true,
  })

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  // Computed
  const hasData = computed(() => metrics.value !== null)
  const hasError = computed(() => error.value !== null)
  const isRefreshing = computed(() => refreshConfig.value.enabled && refreshTimer !== null)

  // Actions

  /**
   * Fetch monitoring data
   */
  async function fetchMonitorData() {
    loading.value = true
    error.value = null

    try {
      const data = await monitorService.getQueueStatus()
      metrics.value = data
      lastUpdated.value = new Date()
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || '获取监控数据失败'
      console.error('Failed to fetch monitor data:', err)

      // Stop auto-refresh on error if configured
      if (!refreshConfig.value.retryOnError) {
        stopAutoRefresh()
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Start auto-refresh
   */
  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    refreshConfig.value.enabled = true
    refreshTimer = setInterval(() => {
      fetchMonitorData()
    }, refreshConfig.value.interval)

    // Fetch immediately
    fetchMonitorData()
  }

  /**
   * Stop auto-refresh
   */
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    refreshConfig.value.enabled = false
  }

  /**
   * Toggle auto-refresh
   */
  function toggleAutoRefresh() {
    if (refreshConfig.value.enabled) {
      stopAutoRefresh()
    } else {
      startAutoRefresh()
    }
  }

  /**
   * Update refresh interval
   */
  function setRefreshInterval(interval: number) {
    refreshConfig.value.interval = interval
    if (refreshConfig.value.enabled) {
      startAutoRefresh() // Restart with new interval
    }
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null
  }

  /**
   * Retry fetching data
   */
  async function retry() {
    clearError()
    await fetchMonitorData()
  }

  return {
    // State
    metrics,
    loading,
    error,
    lastUpdated,
    refreshConfig,

    // Computed
    hasData,
    hasError,
    isRefreshing,

    // Actions
    fetchMonitorData,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    setRefreshInterval,
    clearError,
    retry,
  }
})
