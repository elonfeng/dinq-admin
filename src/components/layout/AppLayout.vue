<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  DashboardOutlined,
  SettingOutlined,
  HistoryOutlined,
  NotificationOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GiftOutlined,
  SolutionOutlined,
  MessageOutlined,
  UserOutlined,
  ToolOutlined,
  BarChartOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import AppHeader from './AppHeader.vue'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

const menuItems = [
  // {
  //   key: 'monitor',
  //   icon: DashboardOutlined,
  //   label: '系统监控',
  //   path: '/monitor',
  // },
  // {
  //   key: 'task-history',
  //   icon: HistoryOutlined,
  //   label: '任务历史',
  //   path: '/task-history',
  // },
  {
    key: 'verification-review',
    icon: SafetyCertificateOutlined,
    label: '认证审核',
    path: '/verification-review',
  },
  {
    key: 'waiting-list',
    icon: TeamOutlined,
    label: '等待列表',
    path: '/waiting-list',
  },
  {
    key: 'invitation-codes',
    icon: GiftOutlined,
    label: '邀请码管理',
    path: '/invitation-codes',
  },
  {
    key: 'notification-send',
    icon: NotificationOutlined,
    label: '发送通知',
    path: '/notification-send',
  },
  {
    key: 'openings',
    icon: SolutionOutlined,
    label: '职位管理',
    path: '/openings',
  },
  {
    key: 'contact-requests',
    icon: MessageOutlined,
    label: '请求演示',
    path: '/contact-requests',
  },
  {
    key: 'user-management',
    icon: UserOutlined,
    label: '用户管理',
    path: '/user-management',
  },
  {
    key: 'user-stats',
    icon: BarChartOutlined,
    label: '用户统计',
    path: '/user-stats',
  },
  {
    key: 'query-analysis',
    icon: SearchOutlined,
    label: 'Query 分析',
    path: '/query-analysis',
  },
  {
    key: 'custom_tool',
    icon: ToolOutlined,
    label: '工具箱',
    path: '/custom_tool',
  },
]

const selectedKeys = ref([route.name as string])

// Watch route changes to update selected menu
watch(
  () => route.name,
  (newName) => {
    if (newName) {
      selectedKeys.value = [newName as string]
    }
  }
)

function handleMenuClick({ key }: { key: string }) {
  const item = menuItems.find((m) => m.key === key)
  if (item) {
    router.push(item.path)
  }
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <!-- Sidebar - Light minimalist theme -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="light"
      :width="220"
      style="border-right: 1px solid rgba(0, 0, 0, 0.06)"
    >
      <div class="logo">
        <h2 v-if="!collapsed">Dinq Admin</h2>
        <h2 v-else>D</h2>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        style="border-right: none"
        @click="handleMenuClick"
      >
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- Main content area -->
    <a-layout>
      <!-- Header -->
      <a-layout-header style="padding: 0; height: 64px; line-height: 64px">
        <div class="header-container">
          <component
            :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            class="trigger"
            @click="collapsed = !collapsed"
          />
          <AppHeader />
        </div>
      </a-layout-header>

      <!-- Content -->
      <a-layout-content style="margin: 0; padding: 0">
        <router-view />
      </a-layout-content>

      <!-- Footer -->
      <a-layout-footer style="text-align: center; padding: 16px 24px">
        Dinq Admin ©2025
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 8px;
}

.logo h2 {
  margin: 0;
  color: #262626;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 100%;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
  color: #595959;
}

.trigger:hover {
  color: #4096ff;
}

/* Menu item styling */
:deep(.ant-menu-item) {
  margin: 4px 8px;
  border-radius: 6px;
  height: 40px;
  line-height: 40px;
}

:deep(.ant-menu-item-selected) {
  background-color: #e6f4ff !important;
  color: #4096ff !important;
}

:deep(.ant-menu-item:hover) {
  background-color: #f5f5f5 !important;
}

:deep(.ant-menu-item-icon) {
  font-size: 16px;
}
</style>
