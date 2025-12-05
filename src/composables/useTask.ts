import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import type { TaskFilter } from '@/types/task'

export function useTask(autoFetch = true) {
  const taskStore = useTaskStore()

  const {
    tasks,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    filters,
    pollingTasks,
    hasData,
    hasError,
    totalPages,
  } = storeToRefs(taskStore)

  const {
    fetchTasks,
    fetchTaskById,
    retryTask,
    pollTask,
    setFilters,
    setPage,
    setPageSize,
    clearFilters,
    clearError,
  } = taskStore

  // Auto-fetch on mount
  if (autoFetch) {
    onMounted(() => {
      fetchTasks()
    })
  }

  async function refreshTasks() {
    return await fetchTasks()
  }

  async function applyFilters(newFilters: Partial<TaskFilter>) {
    setFilters(newFilters)
    return await fetchTasks()
  }

  async function changePage(page: number) {
    setPage(page)
    return await fetchTasks()
  }

  async function changePageSize(size: number) {
    setPageSize(size)
    return await fetchTasks()
  }

  async function resetFilters() {
    clearFilters()
    return await fetchTasks()
  }

  async function retryTaskAndRefresh(taskId: string) {
    const newTaskId = await retryTask(taskId)
    return newTaskId
  }

  async function startPolling(taskId: string) {
    return await pollTask(taskId)
  }

  function isPolling(taskId: string): boolean {
    return pollingTasks.value.has(taskId)
  }

  return {
    // State
    tasks,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    filters,
    hasData,
    hasError,
    totalPages,
    // Actions
    refreshTasks,
    fetchTaskById,
    applyFilters,
    changePage,
    changePageSize,
    resetFilters,
    retryTaskAndRefresh,
    startPolling,
    isPolling,
    clearError,
  }
}
