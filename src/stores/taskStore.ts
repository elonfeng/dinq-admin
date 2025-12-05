import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AsyncTask, TaskFilter } from '@/types/task'
import { taskService } from '@/services/taskService'

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<AsyncTask[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Filters
  const filters = ref<TaskFilter>({
    status: undefined,
    start_date: undefined,
    end_date: undefined,
  })

  // Polling tasks
  const pollingTasks = ref<Set<string>>(new Set())

  // Computed
  const hasData = computed(() => tasks.value.length > 0)
  const hasError = computed(() => error.value !== null)
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  // Actions
  async function fetchTasks() {
    loading.value = true
    error.value = null
    try {
      const params = {
        status: filters.value.status,
        start_date: filters.value.start_date,
        end_date: filters.value.end_date,
        page: currentPage.value,
        page_size: pageSize.value,
      }

      const response = await taskService.getTaskList(params)
      tasks.value = response.tasks
      total.value = response.total
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '获取任务列表失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  async function fetchTaskById(taskId: string): Promise<AsyncTask> {
    loading.value = true
    error.value = null
    try {
      const task = await taskService.getTaskStatus(taskId)

      // Update task in list if exists
      const index = tasks.value.findIndex((t) => t.task_id === taskId)
      if (index >= 0) {
        tasks.value[index] = task
      }

      return task
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '获取任务详情失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  async function retryTask(taskId: string): Promise<string> {
    loading.value = true
    error.value = null
    try {
      const result = await taskService.retryTask(taskId)
      await fetchTasks() // Refresh task list
      return result.task_id
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '重试任务失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  async function pollTask(taskId: string, intervalMs = 2000, maxAttempts = 150) {
    if (pollingTasks.value.has(taskId)) {
      console.warn(`Task ${taskId} is already being polled`)
      return
    }

    pollingTasks.value.add(taskId)
    try {
      const finalTask = await taskService.pollTaskUntilComplete(taskId, intervalMs, maxAttempts)

      // Update task in list
      const index = tasks.value.findIndex((t) => t.task_id === taskId)
      if (index >= 0) {
        tasks.value[index] = finalTask
      }

      return finalTask
    } catch (e: any) {
      error.value = e.message || '任务轮询失败'
      throw error.value
    } finally {
      pollingTasks.value.delete(taskId)
    }
  }

  function setFilters(newFilters: Partial<TaskFilter>) {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1 // Reset to first page when filters change
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1 // Reset to first page when page size changes
  }

  function clearFilters() {
    filters.value = {
      status: undefined,
      start_date: undefined,
      end_date: undefined,
    }
    currentPage.value = 1
  }

  function clearError() {
    error.value = null
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
    pollingTasks,
    // Computed
    hasData,
    hasError,
    totalPages,
    // Actions
    fetchTasks,
    fetchTaskById,
    retryTask,
    pollTask,
    setFilters,
    setPage,
    setPageSize,
    clearFilters,
    clearError,
  }
})
