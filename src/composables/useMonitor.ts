/**
 * Monitor composable
 * Encapsulates auto-refresh and error retry logic
 */

import { onMounted, onUnmounted } from 'vue'
import { useMonitorStore } from '@/stores/monitorStore'
import { storeToRefs } from 'pinia'

export function useMonitor(options: { autoStart?: boolean } = {}) {
  const { autoStart = true } = options
  const monitorStore = useMonitorStore()

  const {
    metrics,
    loading,
    error,
    lastUpdated,
    refreshConfig,
    hasData,
    hasError,
    isRefreshing,
  } = storeToRefs(monitorStore)

  const {
    fetchMonitorData,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    setRefreshInterval,
    clearError,
    retry,
  } = monitorStore

  // Auto-start refresh on component mount
  onMounted(() => {
    if (autoStart) {
      startAutoRefresh()
    }
  })

  // Stop refresh on component unmount
  onUnmounted(() => {
    stopAutoRefresh()
  })

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
}
