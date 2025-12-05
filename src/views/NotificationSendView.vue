<template>
  <div class="notification-send-container">
    <a-card title="发送通知" :bordered="false">
      <a-form :model="formState" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
        <!-- 接收者选择 -->
        <a-form-item label="接收者" name="recipients">
          <a-radio-group v-model:value="recipientType" @change="handleRecipientTypeChange">
            <a-radio value="all">全部用户</a-radio>
            <a-radio value="specific">指定用户</a-radio>
          </a-radio-group>
          <div v-if="recipientType === 'specific'" style="margin-top: 10px">
            <a-input-search
              v-model:value="userSearchKeyword"
              placeholder="搜索用户姓名或邮箱"
              style="margin-bottom: 10px"
              @search="handleUserSearch"
              @change="handleUserSearchChange"
              allow-clear
            />
            <a-select
              v-model:value="formState.user_ids"
              mode="multiple"
              placeholder="请选择用户"
              :options="userOptions"
              :loading="loadingUsers"
              show-search
              :filter-option="filterOption"
            />
          </div>
        </a-form-item>

        <!-- 模板选择 -->
        <a-form-item label="通知模板" name="template_type" required>
          <a-select
            v-model:value="formState.template_type"
            placeholder="请选择通知模板"
            :loading="loadingTemplates"
            @change="handleTemplateChange"
          >
            <a-select-option
              v-for="template in templates"
              :key="template.type"
              :value="template.type"
            >
              {{ template.title }}
              <span style="color: #888; font-size: 12px">
                ({{ template.type }})
              </span>
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 模板预览 -->
        <a-form-item v-if="selectedTemplate" label="模板预览">
          <div style="padding: 12px; background: #f5f5f5; border-radius: 4px">
            <div style="margin-bottom: 8px">
              <strong>标题模板：</strong>
              <span style="color: #1890ff">{{ selectedTemplate.title }}</span>
            </div>
            <div v-if="selectedTemplate.content_template">
              <strong>内容模板：</strong>
              <span style="color: #1890ff">{{ selectedTemplate.content_template }}</span>
            </div>
            <div style="margin-top: 8px; color: #888; font-size: 12px">
              优先级：{{ getPriorityText(selectedTemplate.priority) }}
            </div>
          </div>
        </a-form-item>

        <!-- 动态模板变量输入 -->
        <a-form-item
          v-for="varName in templateVariables"
          :key="varName"
          :label="varName"
        >
          <a-input
            v-model:value="formState.template_vars[varName]"
            :placeholder="`请输入 ${varName}`"
          />
        </a-form-item>

        <!-- 操作按钮 -->
        <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
          <a-space>
            <a-button type="primary" :loading="sending" @click="handleSend">
              {{ sending ? '发送中...' : '发送通知' }}
            </a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 发送结果统计 -->
    <a-card v-if="sendResult" title="发送结果" style="margin-top: 20px" :bordered="false">
      <a-descriptions :column="2">
        <a-descriptions-item label="成功发送">
          <a-tag color="green">{{ sendResult.success_count }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="总数">
          <a-tag color="blue">{{ sendResult.total_count }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态" :span="2">
          <a-tag v-if="sendResult.success_count === sendResult.total_count" color="success">
            全部发送成功
          </a-tag>
          <a-tag v-else color="warning">
            部分发送成功（{{ sendResult.success_count }}/{{ sendResult.total_count }}）
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import notificationService, {
  type User,
  type NotificationTemplate,
} from '@/services/notificationService'

// 表单状态
const formState = reactive({
  user_ids: [] as string[],
  template_type: '',
  template_vars: {} as Record<string, string>,
})

// 接收者类型
const recipientType = ref<'all' | 'specific'>('all')

// 用户列表
const users = ref<User[]>([])
const loadingUsers = ref(false)
const userOptions = ref<{ value: string; label: string }[]>([])
const userSearchKeyword = ref('')

// 模板列表
const templates = ref<NotificationTemplate[]>([])
const loadingTemplates = ref(false)
const selectedTemplate = ref<NotificationTemplate | null>(null)

// 发送状态
const sending = ref(false)
const sendResult = ref<{ success_count: number; total_count: number } | null>(null)

// 从模板中提取变量（{{variable}}）
const templateVariables = computed(() => {
  if (!selectedTemplate.value) {
    return []
  }

  const variables = new Set<string>()
  const regex = /\{\{(\w+)\}\}/g

  // 从标题中提取
  let match: RegExpExecArray | null
  while ((match = regex.exec(selectedTemplate.value.title)) !== null) {
    const variableName = match[1]
    if (variableName) {
      variables.add(variableName)
    }
  }

  // 从内容中提取
  if (selectedTemplate.value.content_template) {
    const contentRegex = /\{\{(\w+)\}\}/g
    while ((match = contentRegex.exec(selectedTemplate.value.content_template)) !== null) {
      const variableName = match[1]
      if (variableName) {
        variables.add(variableName)
      }
    }
  }

  return Array.from(variables)
})

// 加载用户列表
const loadUsers = async (search = '') => {
  loadingUsers.value = true
  try {
    const result = await notificationService.getAllUsers(1000, 0, search)
    users.value = result.users
    userOptions.value = result.users.map((user) => ({
      value: user.id,
      label: `${user.name || user.email} (${user.email})`,
    }))
  } catch (error) {
    message.error('加载用户列表失败')
    console.error(error)
  } finally {
    loadingUsers.value = false
  }
}

// 加载模板列表
const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    const result = await notificationService.getNotificationTemplates()
    templates.value = result.filter((t) => t.is_active) // 只显示启用的模板
  } catch (error) {
    message.error('加载模板列表失败')
    console.error(error)
  } finally {
    loadingTemplates.value = false
  }
}

// 搜索用户
const handleUserSearch = (value: string) => {
  loadUsers(value)
}

// 搜索输入变化
const handleUserSearchChange = (e: any) => {
  const value = e.target.value
  if (!value) {
    // 清空搜索时重新加载所有用户
    loadUsers('')
  }
}

// 过滤选项
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase())
}

// 接收者类型变化
const handleRecipientTypeChange = () => {
  if (recipientType.value === 'all') {
    formState.user_ids = []
  }
}

// 模板变化
const handleTemplateChange = (templateType: string) => {
  selectedTemplate.value = templates.value.find((t) => t.type === templateType) || null
  // 重置模板变量
  formState.template_vars = {}
}

// 获取优先级文本
const getPriorityText = (priority: number) => {
  switch (priority) {
    case 0:
      return '普通'
    case 1:
      return '重要'
    case 2:
      return '紧急'
    default:
      return '未知'
  }
}

// 发送通知
const handleSend = async () => {
  // 验证
  if (!formState.template_type) {
    message.error('请选择通知模板')
    return
  }

  // 验证模板变量
  for (const varName of templateVariables.value) {
    if (!formState.template_vars[varName]) {
      message.error(`请填写模板变量：${varName}`)
      return
    }
  }

  if (recipientType.value === 'specific' && formState.user_ids.length === 0) {
    message.error('请选择接收者')
    return
  }

  // 确认发送
  const userCount =
    recipientType.value === 'all' ? users.value.length : formState.user_ids.length
  const confirmed = confirm(`确认发送通知给 ${userCount} 位用户？`)
  if (!confirmed) {
    return
  }

  sending.value = true
  sendResult.value = null

  try {
    const req = {
      user_ids: recipientType.value === 'all' ? users.value.map((u) => u.id) : formState.user_ids,
      template_type: formState.template_type,
      template_vars: formState.template_vars,
    }

    const response = await notificationService.batchSendNotification(req)
    sendResult.value = response.data

    if (response.data.success_count === response.data.total_count) {
      message.success(`成功发送 ${response.data.success_count} 条通知`)
    } else {
      message.warning(
        `发送完成：成功 ${response.data.success_count}/${response.data.total_count} 条`
      )
    }
  } catch (error) {
    message.error('发送失败')
    console.error(error)
  } finally {
    sending.value = false
  }
}

// 重置表单
const handleReset = () => {
  formState.user_ids = []
  formState.template_type = ''
  formState.template_vars = {}
  recipientType.value = 'all'
  selectedTemplate.value = null
  sendResult.value = null
}

onMounted(() => {
  loadUsers()
  loadTemplates()
})
</script>

<style scoped>
.notification-send-container {
  padding: 24px;
}
</style>
