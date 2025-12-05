<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { HistoryOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { useTask } from '@/composables/useTask'
import TaskFilter from '@/components/task/TaskFilter.vue'
import TaskList from '@/components/task/TaskList.vue'
import TaskDetail from '@/components/task/TaskDetail.vue'
import type { AsyncTask } from '@/types/task'

const {
  tasks,
  total,
  loading,
  error,
  hasError,
  currentPage,
  pageSize,
  filters,
  refreshTasks,
  changePage,
  changePageSize,
  resetFilters,
  retryTaskAndRefresh,
  startPolling,
  fetchTaskById,
  clearError,
} = useTask()

// UI state
const selectedTask = ref<AsyncTask | null>(null)
const detailDrawerOpen = ref(false)

// Handle filter apply
async function handleApplyFilters() {
  try {
    clearError()
    await refreshTasks()
    message.success('筛选已应用')
  } catch (e: any) {
    message.error(e || '应用筛选失败')
  }
}

// Handle filter reset
async function handleResetFilters() {
  try {
    clearError()
    await resetFilters()
    message.success('筛选已重置')
  } catch (e: any) {
    message.error(e || '重置筛选失败')
  }
}

// Handle page change
async function handlePageChange(page: number) {
  try {
    clearError()
    await changePage(page)
  } catch (e: any) {
    message.error(e || '切换页面失败')
  }
}

// Handle page size change
async function handlePageSizeChange(size: number) {
  try {
    clearError()
    await changePageSize(size)
  } catch (e: any) {
    message.error(e || '更改每页条数失败')
  }
}

// Handle task click - show detail
async function handleTaskClick(task: AsyncTask) {
  try {
    clearError()
    // Fetch latest task data
    const latestTask = await fetchTaskById(task.task_id)
    selectedTask.value = latestTask
    detailDrawerOpen.value = true
  } catch (e: any) {
    message.error(e || '获取任务详情失败')
  }
}

// Handle retry
async function handleRetry(taskId: string) {
  try {
    clearError()
    const newTaskId = await retryTaskAndRefresh(taskId)
    message.success(`任务已重试，新任务ID: ${newTaskId}`)
    detailDrawerOpen.value = false
  } catch (e: any) {
    message.error(e || '重试任务失败')
  }
}

// Handle poll
async function handlePoll(taskId: string) {
  try {
    clearError()
    message.loading({ content: '开始轮询任务状态...', key: 'poll', duration: 0 })

    const finalTask = await startPolling(taskId)
    if (!finalTask) {
      message.info({
        content: '该任务正在轮询中，请稍后查看结果',
        key: 'poll',
      })
      return
    }

    message.success({
      content: `任务完成，最终状态: ${finalTask.status}`,
      key: 'poll',
      duration: 3,
    })

    // Update detail if open
    if (selectedTask.value?.task_id === taskId) {
      selectedTask.value = finalTask
    }
  } catch (e: any) {
    message.error({ content: e || '轮询任务失败', key: 'poll', duration: 3 })
  }
}

// Handle refresh
async function handleRefresh() {
  try {
    clearError()
    await refreshTasks()
    message.success('刷新成功')
  } catch (e: any) {
    message.error(e || '刷新失败')
  }
}
</script>

<template>
  <div class="task-history-view">
    <!-- Page header -->
    <div class="page-header">
      <div class="header-content">
        <a-typography-title :level="2">
          <HistoryOutlined />
          任务历史
        </a-typography-title>
        <a-typography-paragraph type="secondary">
          查询历史异步任务、筛选、查看详情并重试失败任务
        </a-typography-paragraph>
      </div>
      <a-button type="primary" :loading="loading" @click="handleRefresh">
        <template #icon>
          <ReloadOutlined />
        </template>
        刷新
      </a-button>
    </div>

    <!-- Error alert -->
    <a-alert
      v-if="hasError"
      :message="error"
      type="error"
      closable
      show-icon
      style="margin-bottom: 16px"
      @close="clearError"
    />

    <!-- Filter -->
    <TaskFilter
      v-model="filters"
      @apply="handleApplyFilters"
      @reset="handleResetFilters"
    />

    <!-- Task list -->
    <a-card :bordered="false" class="task-list-card">
      <TaskList
        :tasks="tasks"
        :loading="loading"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @task-click="handleTaskClick"
        @retry-click="handleRetry"
      />
    </a-card>

    <!-- Task detail drawer -->
    <TaskDetail
      :task="selectedTask"
      :open="detailDrawerOpen"
      @update:open="(val) => (detailDrawerOpen = val)"
      @retry="handleRetry"
      @poll="handlePoll"
    />
  </div>
</template>

<style scoped>
.task-history-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-content {
  flex: 1;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header :deep(.ant-typography) {
  margin-bottom: 0;
  font-size: 14px;
}

.task-list-card {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .task-history-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>
