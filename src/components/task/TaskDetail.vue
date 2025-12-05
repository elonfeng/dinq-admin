<script setup lang="ts">
import { computed } from 'vue'
import type { AsyncTask } from '@/types/task'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue'

interface Props {
  task: AsyncTask | null
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'retry', taskId: string): void
  (e: 'poll', taskId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const statusConfig: Record<
  string,
  { color: string; icon: any; text: string }
> = {
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

const statusInfo = computed(() => {
  if (!props.task) return null
  return statusConfig[props.task.status] || statusConfig.queued
})

const canRetry = computed(() => {
  if (!props.task) return false
  return props.task.status === 'failure' || props.task.status === 'partial_failure'
})

const canPoll = computed(() => {
  if (!props.task) return false
  return props.task.status === 'queued' || props.task.status === 'processing'
})

function handleClose() {
  emit('update:open', false)
}

function handleRetry() {
  if (props.task) {
    emit('retry', props.task.task_id)
  }
}

function handlePoll() {
  if (props.task) {
    emit('poll', props.task.task_id)
  }
}
</script>

<template>
  <a-drawer
    :open="open"
    title="任务详情"
    width="600"
    @close="handleClose"
  >
    <div v-if="task" class="task-detail">
      <!-- Status Section -->
      <div class="detail-section">
        <h3 class="section-title">状态</h3>
        <a-tag v-if="statusInfo" :color="statusInfo.color" class="status-tag">
          <component :is="statusInfo.icon" :spin="task.status === 'processing'" />
          {{ statusInfo.text }}
        </a-tag>
      </div>

      <!-- Basic Info Section -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="任务ID">
            <span class="mono">{{ task.task_id }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            {{ task.status }}
          </a-descriptions-item>
          <a-descriptions-item label="进度">
            <a-progress :percent="task.progress_pct" size="small" />
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ task.created_at }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ task.updated_at }}
          </a-descriptions-item>
          <a-descriptions-item v-if="task.completed_at" label="完成时间">
            {{ task.completed_at }}
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- Progress Steps Section -->
      <div v-if="task.progress_steps && task.progress_steps.length > 0" class="detail-section">
        <h3 class="section-title">执行步骤</h3>
        <a-timeline>
          <a-timeline-item
            v-for="(step, index) in task.progress_steps"
            :key="index"
            :color="index < task.progress_steps.length - 1 ? 'green' : 'blue'"
          >
            {{ step }}
          </a-timeline-item>
        </a-timeline>
      </div>

      <!-- Request Parameters Section -->
      <div v-if="task.request_params" class="detail-section">
        <h3 class="section-title">请求参数</h3>
        <a-card size="small" :bordered="false" class="code-card">
          <pre class="code-block">{{ JSON.stringify(task.request_params, null, 2) }}</pre>
        </a-card>
      </div>

      <!-- Platform Results Section -->
      <div v-if="task.github || task.linkedin || task.twitter || task.youtube || task.scholar || task.huggingface || task.openreview" class="detail-section">
        <h3 class="section-title">平台数据</h3>
        <a-collapse>
          <a-collapse-panel v-if="task.github" key="github" header="GitHub">
            <pre class="code-block">{{ JSON.stringify(task.github, null, 2) }}</pre>
          </a-collapse-panel>
          <a-collapse-panel v-if="task.linkedin" key="linkedin" header="LinkedIn">
            <pre class="code-block">{{ JSON.stringify(task.linkedin, null, 2) }}</pre>
          </a-collapse-panel>
          <a-collapse-panel v-if="task.twitter" key="twitter" header="Twitter">
            <pre class="code-block">{{ JSON.stringify(task.twitter, null, 2) }}</pre>
          </a-collapse-panel>
          <a-collapse-panel v-if="task.youtube" key="youtube" header="YouTube">
            <pre class="code-block">{{ JSON.stringify(task.youtube, null, 2) }}</pre>
          </a-collapse-panel>
          <a-collapse-panel v-if="task.scholar" key="scholar" header="Scholar">
            <pre class="code-block">{{ JSON.stringify(task.scholar, null, 2) }}</pre>
          </a-collapse-panel>
          <a-collapse-panel v-if="task.huggingface" key="huggingface" header="HuggingFace">
            <pre class="code-block">{{ JSON.stringify(task.huggingface, null, 2) }}</pre>
          </a-collapse-panel>
          <a-collapse-panel v-if="task.openreview" key="openreview" header="OpenReview">
            <pre class="code-block">{{ JSON.stringify(task.openreview, null, 2) }}</pre>
          </a-collapse-panel>
        </a-collapse>
      </div>

      <!-- Achievement Network Section -->
      <div v-if="task.achievement" class="detail-section">
        <h3 class="section-title">成就网络</h3>
        <a-card size="small" :bordered="false" class="code-card">
          <pre class="code-block">{{ JSON.stringify(task.achievement, null, 2) }}</pre>
        </a-card>
      </div>

      <!-- Error Section -->
      <div v-if="task.error" class="detail-section">
        <h3 class="section-title">错误信息</h3>
        <a-alert
          type="error"
          :message="task.error"
          show-icon
        />
      </div>

      <!-- Actions -->
      <div class="detail-actions">
        <a-space>
          <a-button v-if="canRetry" type="primary" @click="handleRetry">
            重试任务
          </a-button>
          <a-button v-if="canPoll" @click="handlePoll">
            <template #icon>
              <SyncOutlined />
            </template>
            轮询状态
          </a-button>
          <a-button @click="handleClose">
            关闭
          </a-button>
        </a-space>
      </div>
    </div>

    <a-empty v-else description="暂无任务详情" />
  </a-drawer>
</template>

<style scoped>
.task-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.status-tag {
  font-size: 14px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mono {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: #1677ff;
}

.code-card {
  background-color: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.code-block {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #262626;
  background-color: transparent;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.detail-actions {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* Descriptions styling */
:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  width: 120px;
}

:deep(.ant-descriptions-item-content) {
  font-size: 13px;
}
</style>
