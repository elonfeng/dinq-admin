<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TaskStatus, TaskFilter } from '@/types/task'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'

interface Props {
  modelValue: TaskFilter
}

interface Emits {
  (e: 'update:modelValue', value: TaskFilter): void
  (e: 'apply'): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref<TaskFilter>({ ...props.modelValue })

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    localFilters.value = { ...newValue }
  },
  { deep: true }
)

// Status options
const statusOptions: { label: string; value: TaskStatus }[] = [
  { label: '排队中', value: 'queued' },
  { label: '处理中', value: 'processing' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failure' },
  { label: '部分失败', value: 'partial_failure' },
]

// Date range
const dateRange = ref<[Dayjs, Dayjs] | null>(null)

function handleStatusChange(value: TaskStatus | undefined) {
  localFilters.value.status = value
  emit('update:modelValue', localFilters.value)
}

function handleDateRangeChange(dates: [Dayjs, Dayjs] | null) {
  if (dates && dates.length === 2) {
    localFilters.value.start_date = dates[0].format('YYYY-MM-DD')
    localFilters.value.end_date = dates[1].format('YYYY-MM-DD')
  } else {
    localFilters.value.start_date = undefined
    localFilters.value.end_date = undefined
  }
  emit('update:modelValue', localFilters.value)
}

function handleApply() {
  emit('apply')
}

function handleReset() {
  localFilters.value = {
    status: undefined,
    start_date: undefined,
    end_date: undefined,
  }
  dateRange.value = null
  emit('update:modelValue', localFilters.value)
  emit('reset')
}
</script>

<template>
  <a-card size="small" :bordered="false" class="filter-card">
    <div class="filter-container">
      <a-space :size="16" wrap>
        <!-- Status filter -->
        <div class="filter-item">
          <label class="filter-label">任务状态</label>
          <a-select
            :value="localFilters.status"
            placeholder="全部状态"
            style="width: 140px"
            allow-clear
            @update:value="handleStatusChange"
          >
            <a-select-option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </div>

        <!-- Date range filter -->
        <div class="filter-item">
          <label class="filter-label">创建时间</label>
          <a-range-picker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            style="width: 240px"
            @update:value="handleDateRangeChange"
          />
        </div>

        <!-- Action buttons -->
        <div class="filter-actions">
          <a-button type="primary" @click="handleApply">
            <template #icon>
              <FilterOutlined />
            </template>
            应用筛选
          </a-button>
          <a-button @click="handleReset">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </div>
      </a-space>
    </div>
  </a-card>
</template>

<style scoped>
.filter-card {
  margin-bottom: 16px;
  background-color: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-container {
  display: flex;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #595959;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

/* Card styling */
:deep(.ant-card-body) {
  padding: 16px;
}
</style>
