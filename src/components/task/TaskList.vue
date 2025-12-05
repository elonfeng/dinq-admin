<script setup lang="ts">
import { formatRelativeTime } from '@/utils/formatter'
import type { AsyncTask } from '@/types/task'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

interface Props {
  tasks: AsyncTask[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  total?: number
}

interface Emits {
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
  (e: 'task-click', task: AsyncTask): void
  (e: 'retry-click', taskId: string): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
  currentPage: 1,
  pageSize: 20,
  total: 0,
})

const emit = defineEmits<Emits>()

// Table columns
const columns = [
  {
    title: '任务ID',
    dataIndex: 'task_id',
    key: 'task_id',
    width: 200,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
  },
  {
    title: '进度',
    dataIndex: 'progress_pct',
    key: 'progress_pct',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '完成时间',
    dataIndex: 'completed_at',
    key: 'completed_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
  },
]

// Status tag config
type StatusConfig = { color: string; icon: any; text: string }

const statusConfig: Record<string, StatusConfig> = {
  queued: {
    color: 'default',
    icon: ClockCircleOutlined,
    text: '排队中',
  },
  processing: {
    color: 'processing',
    icon: SyncOutlined,
    text: '处理中',
  },
  success: {
    color: 'success',
    icon: CheckCircleOutlined,
    text: '成功',
  },
  failure: {
    color: 'error',
    icon: CloseCircleOutlined,
    text: '失败',
  },
  partial_failure: {
    color: 'warning',
    icon: ExclamationCircleOutlined,
    text: '部分失败',
  },
}

function getStatusConfig(status: string): StatusConfig {
  return (statusConfig[status] ?? statusConfig.queued) as StatusConfig
}

function handleRowClick(task: AsyncTask) {
  emit('task-click', task)
}

function handleRetry(taskId: string) {
  emit('retry-click', taskId)
}

function handlePageChange(page: number) {
  emit('page-change', page)
}

function handlePageSizeChange(_current: number, size: number) {
  emit('page-size-change', size)
}
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="tasks"
    :loading="loading"
    :pagination="{
      current: currentPage,
      pageSize: pageSize,
      total: total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条记录`,
      onChange: handlePageChange,
      onShowSizeChange: handlePageSizeChange,
    }"
    :row-key="(record: AsyncTask) => record.task_id"
    :row-class-name="() => 'task-row'"
    @row-click="(record: AsyncTask) => handleRowClick(record)"
  >
    <!-- Task ID column -->
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'task_id'">
        <a-tooltip :title="record.task_id">
          <span class="task-id">{{ record.task_id.slice(0, 8) }}...</span>
        </a-tooltip>
      </template>

      <!-- Progress column -->
      <template v-else-if="column.key === 'progress_pct'">
        <a-progress :percent="record.progress_pct" :size="'small'" />
      </template>

      <!-- Status column -->
      <template v-else-if="column.key === 'status'">
        <a-tag :color="getStatusConfig(record.status).color">
          <component :is="getStatusConfig(record.status).icon" :spin="record.status === 'processing'" />
          {{ getStatusConfig(record.status).text }}
        </a-tag>
      </template>

      <!-- Created at column -->
      <template v-else-if="column.key === 'created_at'">
        <a-tooltip :title="record.created_at">
          <span>{{ formatRelativeTime(record.created_at) }}</span>
        </a-tooltip>
      </template>

      <!-- Completed at column -->
      <template v-else-if="column.key === 'completed_at'">
        <a-tooltip v-if="record.completed_at" :title="record.completed_at">
          <span>{{ formatRelativeTime(record.completed_at) }}</span>
        </a-tooltip>
        <span v-else class="text-muted">-</span>
      </template>

      <!-- Actions column -->
      <template v-else-if="column.key === 'actions'">
        <a-button
          v-if="record.status === 'failure' || record.status === 'partial_failure'"
          type="link"
          size="small"
          @click.stop="handleRetry(record.task_id)"
        >
          <template #icon>
            <ReloadOutlined />
          </template>
          重试
        </a-button>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.task-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-row:hover {
  background-color: #fafafa !important;
}

.task-id {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: #1677ff;
}

.task-type {
  font-size: 13px;
  color: #595959;
}

.text-muted {
  color: #bfbfbf;
}

/* Table styling */
:deep(.ant-table-cell) {
  font-size: 13px;
}

:deep(.ant-tag) {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

:deep(.ant-pagination) {
  margin-top: 16px;
}
</style>
