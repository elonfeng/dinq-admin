<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const credentials = ref<LoginCredentials>({
  username: '',
  password: '',
})

async function handleLogin() {
  if (!credentials.value.username || !credentials.value.password) {
    message.warning('请输入邮箱和密码')
    return
  }

  loading.value = true

  try {
    const success = await authStore.login(credentials.value)

    if (success) {
      message.success('登录成功')
      router.push('/monitor')
    } else {
      message.error('邮箱或密码错误')
    }
  } catch (error: any) {
    message.error(error.response?.data?.error || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}

function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Dinq 后台管理</h1>
        <p>系统监控与权重配置管理</p>
      </div>

      <a-form layout="vertical" class="login-form" @keypress="handleKeyPress">
        <a-form-item label="邮箱">
          <a-input
            v-model:value="credentials.username"
            size="large"
            placeholder="请输入邮箱"
            allow-clear
            type="email"
          >
            <template #prefix>
              <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码">
          <a-input-password
            v-model:value="credentials.password"
            size="large"
            placeholder="请输入密码"
            allow-clear
          >
            <template #prefix>
              <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            size="large"
            block
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </a-button>
        </a-form-item>

        <div class="login-hint">
          <a-alert
            type="info"
            show-icon
            message="管理员登录"
          >
            <template #description>
              <div style="font-size: 12px; margin-top: 4px;">
                请使用您的 Dinq 账号邮箱和密码登录
              </div>
            </template>
          </a-alert>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 三原色几何装饰 */
.login-container::before,
.login-container::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  pointer-events: none;
}

.login-container::before {
  width: 400px;
  height: 400px;
  background: #1890ff;
  top: -100px;
  left: -100px;
}

.login-container::after {
  width: 300px;
  height: 300px;
  background: #ff4d4f;
  bottom: -80px;
  right: -80px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 8px;
  padding: 48px 40px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

/* 三原色装饰条 */
.login-header::before {
  content: '';
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #1890ff 0%, #faad14 50%, #ff4d4f 100%);
  border-radius: 2px;
}

.login-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  letter-spacing: 0.5px;
}

.login-header p {
  margin: 0;
  font-size: 14px;
  color: #8c8c8c;
}

.login-form {
  margin-top: 24px;
}

.login-hint {
  margin-top: 24px;
}

.login-hint code {
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  color: #1890ff;
}

/* Force light theme colors for inputs */
:deep(.ant-input),
:deep(.ant-input-password),
:deep(.ant-input-affix-wrapper) {
  background-color: #ffffff !important;
  border-color: #d9d9d9 !important;
  color: #262626 !important;
}

:deep(.ant-input::placeholder),
:deep(.ant-input-password::placeholder) {
  color: rgba(0, 0, 0, 0.25) !important;
}

:deep(.ant-input:focus),
:deep(.ant-input-affix-wrapper:focus),
:deep(.ant-input-affix-wrapper-focused) {
  border-color: #4096ff !important;
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.1) !important;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #262626 !important;
}

:deep(.ant-btn-primary) {
  background: #1890ff;
  border: none;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

:deep(.ant-btn-primary):hover {
  background: #40a9ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>
