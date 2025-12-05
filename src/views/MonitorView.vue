<script setup lang="ts">
import { ref } from 'vue'
import { DashboardOutlined } from '@ant-design/icons-vue'
import QueueMonitorDashboard from '@/components/monitor/QueueMonitorDashboard.vue'

// Active dashboard tab
const activeDashboard = ref('queue')

// Dashboard configurations - easy to add more dashboards in the future
const dashboards = [
  {
    key: 'queue',
    label: 'Card生成监控',
    icon: DashboardOutlined,
    component: QueueMonitorDashboard,
  },
  // Future dashboards can be added here:
  // {
  //   key: 'performance',
  //   label: '性能监控',
  //   icon: LineChartOutlined,
  //   component: PerformanceMonitorDashboard,
  // },
  // {
  //   key: 'error',
  //   label: '错误监控',
  //   icon: ExclamationCircleOutlined,
  //   component: ErrorMonitorDashboard,
  // },
]
</script>

<template>
  <div class="monitor-view">
    <!-- Page header -->
    <div class="page-header">
      <a-typography-title :level="2">系统监控</a-typography-title>
      <a-typography-paragraph type="secondary">
        实时监控系统运行状态和性能指标
      </a-typography-paragraph>
    </div>

    <!-- Dashboard tabs -->
    <a-tabs v-model:activeKey="activeDashboard" size="large" class="dashboard-tabs">
      <a-tab-pane
        v-for="dashboard in dashboards"
        :key="dashboard.key"
        :tab="dashboard.label"
      >
        <template #tab>
          <span>
            <component :is="dashboard.icon" />
            {{ dashboard.label }}
          </span>
        </template>
        <component :is="dashboard.component" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped>
.monitor-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.page-header :deep(.ant-typography) {
  margin-bottom: 0;
  font-size: 14px;
}

.dashboard-tabs {
  margin-bottom: 24px;
}

.dashboard-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 24px;
}

.dashboard-tabs :deep(.ant-tabs-tab) {
  padding: 12px 0;
  font-size: 15px;
}

.dashboard-tabs :deep(.ant-tabs-tab-icon) {
  margin-right: 6px;
}

@media (max-width: 768px) {
  .monitor-view {
    padding: 16px;
  }
}

/* Card styling */
:deep(.ant-card) {
  margin-bottom: 0;
}

:deep(.ant-card-head-title) {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-card-body) {
  padding: 20px;
}
</style>
