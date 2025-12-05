<script setup lang="ts">
import { computed } from 'vue'
import type { MonitorMetrics } from '@/types/monitor'
import { formatNumber, formatMemory, formatPercentage, formatDateTime } from '@/utils/formatter'

interface Props {
  peaks: MonitorMetrics['peaks_7d'] | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const columns = [
  {
    title: '指标',
    dataIndex: 'metric',
    key: 'metric',
  },
  {
    title: '峰值',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
  },
]

const dataSource = computed(() => {
  if (!props.peaks) return []

  return [
    {
      key: '1',
      metric: '最高并发任务数',
      value: formatNumber(props.peaks.max_concurrent_tasks),
      time: formatDateTime(props.peaks.max_concurrent_time),
    },
    {
      key: '2',
      metric: '最高内存占用',
      value: formatMemory(props.peaks.max_memory_mb),
      time: formatDateTime(props.peaks.max_memory_time),
    },
    {
      key: '3',
      metric: '最高 CPU 使用率',
      value: formatPercentage(props.peaks.max_cpu_percent),
      time: formatDateTime(props.peaks.max_cpu_time),
    },
  ]
})

const trackingSince = computed(() => {
  if (!props.peaks) return ''
  return formatDateTime(props.peaks.tracking_since)
})
</script>

<template>
  <a-card :loading="loading" :bordered="false">
    <template #title>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>7天峰值指标</span>
        <a-tag v-if="trackingSince" color="blue">
          跟踪起始: {{ trackingSince }}
        </a-tag>
      </div>
    </template>

    <a-skeleton :loading="loading" active>
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :pagination="false"
        size="small"
      />
    </a-skeleton>
  </a-card>
</template>
