<script setup lang="ts">
import { computed } from 'vue'
import {
  SyncOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { useMonitor } from '@/composables/useMonitor'
import { formatRelativeTime } from '@/utils/formatter'
import MetricsCard from './MetricsCard.vue'
import StatsChart from './StatsChart.vue'
import PeaksTable from './PeaksTable.vue'

const {
  metrics,
  loading,
  error,
  lastUpdated,
  refreshConfig,
  hasData,
  hasError,
  isRefreshing,
  toggleAutoRefresh,
  retry,
  setRefreshInterval,
} = useMonitor()

const currentMetrics = computed(() => metrics.value?.current)
const stats7d = computed(() => metrics.value?.stats_7d)
const peaks7d = computed(() => metrics.value?.peaks_7d)

const lastUpdateText = computed(() => {
  if (!lastUpdated.value) return '从未更新'
  return `最后更新: ${formatRelativeTime(lastUpdated.value)}`
})

const refreshIntervalOptions = [
  { label: '3秒', value: 3000 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
]

function handleIntervalChange(value: number) {
  setRefreshInterval(value)
}
</script>

<template>
  <div class="queue-monitor-dashboard">
    <!-- Control bar -->
    <div class="control-bar">
      <a-space>
        <!-- Refresh interval selector -->
        <a-select
          :value="refreshConfig.interval"
          style="width: 100px"
          size="small"
          @change="handleIntervalChange"
        >
          <a-select-option
            v-for="option in refreshIntervalOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>

        <!-- Auto-refresh toggle -->
        <a-button size="small" @click="toggleAutoRefresh">
          <template #icon>
            <component :is="isRefreshing ? PauseCircleOutlined : PlayCircleOutlined" />
          </template>
          {{ isRefreshing ? '暂停' : '开始' }}
        </a-button>

        <!-- Last update time -->
        <a-tag v-if="hasData" color="blue">
          <SyncOutlined :spin="loading" />
          {{ lastUpdateText }}
        </a-tag>
      </a-space>
    </div>

    <!-- Error alert -->
    <a-alert
      v-if="hasError"
      :message="error"
      type="error"
      show-icon
      closable
      style="margin-bottom: 24px"
    >
      <template #action>
        <a-button size="small" type="primary" @click="retry">
          <template #icon>
            <ReloadOutlined />
          </template>
          重试
        </a-button>
      </template>
    </a-alert>

    <!-- Current metrics cards -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 24px">
      <a-col :xs="24" :sm="12" :lg="6">
        <MetricsCard
          title="活跃任务数"
          :value="currentMetrics?.active_tasks ?? 0"
          type="number"
          color="#4096ff"
          :loading="loading && !hasData"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <MetricsCard
          title="排队任务数"
          :value="currentMetrics?.queued_tasks ?? 0"
          type="number"
          color="#faad14"
          :loading="loading && !hasData"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <MetricsCard
          title="内存占用"
          :value="currentMetrics?.memory_mb ?? 0"
          type="memory"
          color="#73d13d"
          :loading="loading && !hasData"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <MetricsCard
          title="CPU 使用率"
          :value="currentMetrics?.cpu_percent ?? 0"
          type="percentage"
          color="#ff7a45"
          :loading="loading && !hasData"
        />
      </a-col>
    </a-row>

    <!-- Statistics and peaks -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <StatsChart
          :success="stats7d?.success ?? 0"
          :failure="stats7d?.failure ?? 0"
          :partial-failure="stats7d?.partial_failure ?? 0"
          :loading="loading && !hasData"
        />
      </a-col>
      <a-col :xs="24" :lg="12">
        <PeaksTable :peaks="peaks7d ?? null" :loading="loading && !hasData" />
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.queue-monitor-dashboard {
  padding: 0;
}

.control-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* Card spacing */
:deep(.ant-card) {
  margin-bottom: 0;
}

/* Alert styling */
:deep(.ant-alert) {
  border-radius: 8px;
}
</style>
