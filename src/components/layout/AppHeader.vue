<script setup lang="ts">
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import { UserOutlined, LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    icon: () => h(ExclamationCircleOutlined),
    content: '确定要退出登录吗？',
    okText: '退出',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      authStore.logout()
      message.success('已退出登录')
      router.push('/login')
    },
  })
}
</script>

<template>
  <div class="header-actions">
    <!-- User info -->
    <div class="user-info">
      <UserOutlined style="margin-right: 6px" />
      <span>{{ authStore.username }}</span>
    </div>

    <!-- Logout button -->
    <a-tooltip title="退出登录" placement="bottom">
      <a-button type="text" size="large" @click="handleLogout" class="action-btn">
        <template #icon>
          <LogoutOutlined />
        </template>
      </a-button>
    </a-tooltip>
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.03);
  color: #595959;
  font-size: 14px;
  font-weight: 500;
  margin-right: 4px;
}

.action-btn {
  color: #595959;
  transition: all 0.2s;
}

.action-btn:hover {
  color: #4096ff;
  background-color: rgba(64, 150, 255, 0.08);
}

:deep(.anticon) {
  font-size: 18px;
}
</style>
