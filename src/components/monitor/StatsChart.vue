<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// Register ECharts components
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

interface Props {
  success: number
  failure: number
  partialFailure: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const chartOption = computed<EChartsOption>(() => ({
  title: {
    text: '7天任务统计',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
  series: [
    {
      name: '任务状态',
      type: 'pie',
      radius: '50%',
      data: [
        { value: props.success, name: '成功', itemStyle: { color: '#52c41a' } },
        { value: props.failure, name: '失败', itemStyle: { color: '#f5222d' } },
        {
          value: props.partialFailure,
          name: '部分失败',
          itemStyle: { color: '#faad14' },
        },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}))
</script>

<template>
  <a-card title="7天任务统计" :loading="loading" :bordered="false">
    <a-skeleton :loading="loading" active>
      <v-chart :option="chartOption" style="height: 300px" autoresize />
    </a-skeleton>
  </a-card>
</template>
