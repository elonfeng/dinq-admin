<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber, formatMemory, formatPercentage } from '@/utils/formatter'

interface Props {
  title: string
  value: number | string
  unit?: string
  type?: 'number' | 'memory' | 'percentage'
  icon?: string
  color?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'number',
  color: '#1890ff',
  loading: false,
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value

  switch (props.type) {
    case 'memory':
      return formatMemory(props.value)
    case 'percentage':
      return formatPercentage(props.value)
    case 'number':
    default:
      return formatNumber(props.value)
  }
})
</script>

<template>
  <a-card :loading="loading" :bordered="false" class="metrics-card">
    <a-skeleton :loading="loading" active>
      <a-statistic
        :title="title"
        :value="formattedValue"
        :value-style="{ color: color }"
      >
        <template v-if="icon" #prefix>
          <component :is="icon" />
        </template>
        <template v-if="unit" #suffix>
          {{ unit }}
        </template>
      </a-statistic>
    </a-skeleton>
  </a-card>
</template>

<style scoped>
.metrics-card {
  text-align: center;
  height: 100%;
}

.metrics-card :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
}

.metrics-card :deep(.ant-statistic) {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metrics-card :deep(.ant-statistic-title) {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: 500;
}

.metrics-card :deep(.ant-statistic-content) {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.metrics-card :deep(.ant-statistic-content-prefix) {
  margin-right: 8px;
}
</style>
