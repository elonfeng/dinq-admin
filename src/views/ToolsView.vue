<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  UploadOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CopyOutlined,
  ImportOutlined,
  AlertOutlined,
} from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import apiClient from '@/services/api'
import { roleModelService } from '@/services/roleModelService'
import type { RoleModel, CreateRoleModelRequest, UpdateRoleModelRequest } from '@/types/roleModel'
import { formatDateTime } from '@/utils/formatter'

// === Tab State ===
const activeTab = ref('image-upload')

// === Image Upload State ===
const uploadLoading = ref(false)
const uploadedUrls = ref<string[]>([])

// === Role Model State ===
const roleModels = ref<RoleModel[]>([])
const categories = ref<string[]>([])
const loading = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
})

// Filters
const filterCategory = ref<string | undefined>(undefined)
const filterKeyword = ref('')

// Modal state
const modalVisible = ref(false)
const modalTitle = ref('Create Role Model')
const editingId = ref<string | null>(null)
const formLoading = ref(false)
const formData = ref<CreateRoleModelRequest>({
  name: '',
  category: '',
  photo: '',
  school: '',
  brief: '',
  highlight_brief: '',
})

// Import modal
const importModalVisible = ref(false)
const importLoading = ref(false)

// === Alert Settings State ===
interface AlertConfig {
  enabled: boolean
  threshold_percent: number
  alert_emails: string[]
  service_limits: Record<string, number>
  cooldown_minutes: number
}

const alertLoading = ref(false)
const alertSaving = ref(false)
const alertConfig = ref<AlertConfig>({
  enabled: true,
  threshold_percent: 60,
  alert_emails: [],
  service_limits: {
    firecrawl: 1000,
    tavily: 1000,
    scrapingdog: 1000,
    openrouter: 1000,
    apify: 1000,
  },
  cooldown_minutes: 10,
})
const newAlertEmail = ref('')

const serviceDisplayNames: Record<string, string> = {
  firecrawl: 'Firecrawl',
  tavily: 'Tavily Search',
  scrapingdog: 'Scrapingdog',
  openrouter: 'OpenRouter',
  apify: 'Apify',
}

const serviceLimitsList = computed(() => {
  return Object.entries(alertConfig.value.service_limits).map(([service, limit]) => ({
    service,
    limit,
  }))
})

// === Image Upload Methods ===
const handleUpload: UploadProps['customRequest'] = async (options) => {
  const { file, onSuccess, onError } = options
  uploadLoading.value = true

  try {
    // Step 1: Get upload URL
    const uploadUrlResponse = await apiClient.post('/upload/url', {
      filename: (file as File).name,
      content_type: (file as File).type,
    })
    const { upload_url, file_key } = uploadUrlResponse.data?.data || uploadUrlResponse.data

    // Step 2: Upload to OSS
    await fetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': (file as File).type,
      },
    })

    // Step 3: Confirm upload
    const confirmResponse = await apiClient.post('/upload/confirm', {
      file_key,
    })
    const { url } = confirmResponse.data?.data || confirmResponse.data

    uploadedUrls.value.unshift(url)
    message.success('Upload successful')
    onSuccess?.(url)
  } catch (e: any) {
    message.error(e.response?.data?.error || 'Upload failed')
    onError?.(e)
  } finally {
    uploadLoading.value = false
  }
}

const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url)
  message.success('URL copied to clipboard')
}

const clearUrls = () => {
  uploadedUrls.value = []
}

// === Role Model Methods ===
const loadRoleModels = async () => {
  loading.value = true
  try {
    const result = await roleModelService.list({
      category: filterCategory.value,
      keyword: filterKeyword.value,
      page: pagination.value.current,
      page_size: pagination.value.pageSize,
    })
    roleModels.value = result.items
    pagination.value.total = result.total
  } catch (e: any) {
    message.error(e.response?.data?.error || 'Failed to load role models')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await roleModelService.getCategories()
  } catch (e) {
    console.error('Failed to load categories:', e)
  }
}

const handleSearch = () => {
  pagination.value.current = 1
  loadRoleModels()
}

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  loadRoleModels()
}

const openCreateModal = () => {
  modalTitle.value = 'Create Role Model'
  editingId.value = null
  formData.value = {
    name: '',
    category: '',
    photo: '',
    school: '',
    brief: '',
    highlight_brief: '',
  }
  modalVisible.value = true
}

const openEditModal = (record: RoleModel) => {
  modalTitle.value = 'Edit Role Model'
  editingId.value = record.id
  formData.value = {
    name: record.name,
    category: record.category,
    photo: record.photo,
    school: record.school,
    brief: record.brief,
    highlight_brief: record.highlight_brief,
  }
  modalVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.value.name) {
    message.warning('Name is required')
    return
  }

  formLoading.value = true
  try {
    if (editingId.value) {
      await roleModelService.update(editingId.value, formData.value as UpdateRoleModelRequest)
      message.success('Updated successfully')
    } else {
      await roleModelService.create(formData.value)
      message.success('Created successfully')
    }
    modalVisible.value = false
    loadRoleModels()
    loadCategories()
  } catch (e: any) {
    message.error(e.response?.data?.error || 'Operation failed')
  } finally {
    formLoading.value = false
  }
}

const handleDelete = (record: RoleModel) => {
  Modal.confirm({
    title: 'Confirm Delete',
    content: `Are you sure to delete "${record.name}"?`,
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      try {
        await roleModelService.delete(record.id)
        message.success('Deleted successfully')
        loadRoleModels()
        loadCategories()
      } catch (e: any) {
        message.error(e.response?.data?.error || 'Delete failed')
      }
    },
  })
}

// Import
const handleImport: UploadProps['customRequest'] = async (options) => {
  const { file, onSuccess, onError } = options
  importLoading.value = true

  try {
    const result = await roleModelService.import(file as File)
    message.success(`${result.message}: ${result.count} records imported`)
    onSuccess?.(result)
    importModalVisible.value = false
    loadRoleModels()
    loadCategories()
  } catch (e: any) {
    message.error(e.response?.data?.error || 'Import failed')
    onError?.(e)
  } finally {
    importLoading.value = false
  }
}

// Table columns
const columns = [
  {
    title: 'Photo',
    dataIndex: 'photo',
    key: 'photo',
    width: 80,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    width: 120,
  },
  {
    title: 'School',
    dataIndex: 'school',
    key: 'school',
    width: 150,
  },
  {
    title: 'Brief',
    dataIndex: 'brief',
    key: 'brief',
    ellipsis: true,
  },
  {
    title: 'Created At',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    fixed: 'right',
  },
]

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c, label: c }))
)

// === Alert Settings Methods ===
const loadAlertConfig = async () => {
  alertLoading.value = true
  try {
    const resp = await apiClient.get<{
      code: number
      data: AlertConfig
      message: string
    }>('/admin/alert-settings')
    if (resp.data.code === 0 && resp.data.data) {
      alertConfig.value = resp.data.data
    }
  } catch (e: any) {
    message.error('获取告警配置失败')
  } finally {
    alertLoading.value = false
  }
}

const saveAlertConfig = async () => {
  alertSaving.value = true
  try {
    const resp = await apiClient.post<{
      code: number
      message: string
    }>('/admin/alert-settings', alertConfig.value)
    if (resp.data.code === 0) {
      message.success('保存成功')
    } else {
      message.error(resp.data.message || '保存失败')
    }
  } catch (e: any) {
    message.error('保存失败')
  } finally {
    alertSaving.value = false
  }
}

const addAlertEmail = () => {
  const email = newAlertEmail.value.trim()
  if (!email) return
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    message.warning('请输入有效的邮箱地址')
    return
  }
  if (alertConfig.value.alert_emails.includes(email)) {
    message.warning('该邮箱已存在')
    return
  }
  alertConfig.value.alert_emails.push(email)
  newAlertEmail.value = ''
}

const removeAlertEmail = (email: string, e?: Event) => {
  e?.preventDefault()
  alertConfig.value.alert_emails = alertConfig.value.alert_emails.filter((item) => item !== email)
}

const updateServiceLimit = (service: string, limit: number) => {
  alertConfig.value.service_limits[service] = limit
}

onMounted(() => {
  loadRoleModels()
  loadCategories()
  loadAlertConfig()
})
</script>

<template>
  <div class="tools-view">
    <a-page-header title="Tools" sub-title="Image upload and Role Model management" />

    <a-tabs v-model:activeKey="activeTab" type="card">
      <!-- Image Upload Tab -->
      <a-tab-pane key="image-upload" tab="Image Upload">
        <template #tab>
          <span><UploadOutlined /> Image Upload</span>
        </template>
        <a-card>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-upload
                :custom-request="handleUpload"
                :show-upload-list="false"
                accept="image/*"
                :multiple="true"
              >
                <a-button type="primary" :loading="uploadLoading" size="large" block>
                  <template #icon><UploadOutlined /></template>
                  Upload Image
                </a-button>
              </a-upload>
              <a-typography-text type="secondary" style="display: block; margin-top: 8px">
                Support: JPG, PNG, GIF, WebP, SVG
              </a-typography-text>
            </a-col>
            <a-col :span="16">
              <div v-if="uploadedUrls.length > 0">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px">
                  <a-typography-title :level="5" style="margin: 0">
                    Uploaded URLs ({{ uploadedUrls.length }})
                  </a-typography-title>
                  <a-button size="small" @click="clearUrls">Clear All</a-button>
                </div>
                <a-list :data-source="uploadedUrls" size="small" bordered>
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%">
                        <a-image :src="item" :width="48" :height="48" style="object-fit: cover; border-radius: 4px" />
                        <a-typography-text
                          style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
                        >
                          {{ item }}
                        </a-typography-text>
                        <a-button type="primary" size="small" @click="copyUrl(item)">
                          <template #icon><CopyOutlined /></template>
                          Copy
                        </a-button>
                      </div>
                    </a-list-item>
                  </template>
                </a-list>
              </div>
              <a-empty v-else description="No uploaded images" />
            </a-col>
          </a-row>
        </a-card>
      </a-tab-pane>

      <!-- Role Model Management Tab -->
      <a-tab-pane key="role-models" tab="Role Models">
        <template #tab>
          <span><TeamOutlined /> Role Models</span>
        </template>
        <a-card>
          <!-- Toolbar -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
            <a-space>
              <a-select
                v-model:value="filterCategory"
                :options="categoryOptions"
                placeholder="Filter by category"
                style="width: 160px"
                allowClear
                @change="handleSearch"
              />
              <a-input-search
                v-model:value="filterKeyword"
                placeholder="Search name or brief"
                style="width: 240px"
                @search="handleSearch"
              >
                <template #prefix><SearchOutlined /></template>
              </a-input-search>
            </a-space>
            <a-space>
              <a-button @click="importModalVisible = true">
                <template #icon><ImportOutlined /></template>
                Import
              </a-button>
              <a-button type="primary" @click="openCreateModal">
                <template #icon><PlusOutlined /></template>
                Create
              </a-button>
            </a-space>
          </div>

          <!-- Table -->
          <a-table
            :columns="columns"
            :data-source="roleModels"
            :loading="loading"
            :pagination="{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total: number) => `Total ${total} items`,
            }"
            :scroll="{ x: 1000 }"
            row-key="id"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'photo'">
                <a-image
                  v-if="record.photo"
                  :src="record.photo"
                  :width="48"
                  :height="48"
                  style="object-fit: cover; border-radius: 4px"
                />
                <span v-else class="text-muted">-</span>
              </template>
              <template v-else-if="column.key === 'category'">
                <a-tag color="blue">{{ record.category }}</a-tag>
              </template>
              <template v-else-if="column.key === 'created_at'">
                {{ record.created_at ? formatDateTime(record.created_at) : '-' }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="text" size="small" @click="openEditModal(record)">
                    <template #icon><EditOutlined /></template>
                  </a-button>
                  <a-button type="text" size="small" danger @click="handleDelete(record)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- Alert Settings Tab -->
      <a-tab-pane key="alert-settings" tab="Alert Settings">
        <template #tab>
          <span><AlertOutlined /> Alert Settings</span>
        </template>
        <a-spin :spinning="alertLoading">
          <a-space direction="vertical" :size="16" style="width: 100%">
            <!-- 基本设置 -->
            <a-card title="基本设置" size="small">
              <a-form layout="vertical">
                <a-row :gutter="24">
                  <a-col :span="8">
                    <a-form-item label="启用告警">
                      <a-switch v-model:checked="alertConfig.enabled" />
                      <span style="margin-left: 12px; color: #666">
                        {{ alertConfig.enabled ? '已启用' : '已禁用' }}
                      </span>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="告警阈值 (%)">
                      <a-input-number
                        v-model:value="alertConfig.threshold_percent"
                        :min="1"
                        :max="100"
                        style="width: 100%"
                      />
                      <div style="color: #666; font-size: 12px; margin-top: 4px">
                        使用量超过总容量的 {{ alertConfig.threshold_percent }}% 时触发告警
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="告警冷却时间 (分钟)">
                      <a-input-number
                        v-model:value="alertConfig.cooldown_minutes"
                        :min="1"
                        :max="1440"
                        style="width: 100%"
                      />
                      <div style="color: #666; font-size: 12px; margin-top: 4px">
                        同一服务在 {{ alertConfig.cooldown_minutes }} 分钟内不会重复告警
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>

            <!-- 告警邮箱 -->
            <a-card title="告警邮箱" size="small">
              <a-form layout="vertical">
                <a-form-item label="添加邮箱">
                  <a-input-group compact>
                    <a-input
                      v-model:value="newAlertEmail"
                      placeholder="输入邮箱地址"
                      style="width: 300px"
                      @keyup.enter="addAlertEmail"
                    />
                    <a-button type="primary" @click="addAlertEmail">添加</a-button>
                  </a-input-group>
                </a-form-item>

                <a-form-item label="已配置邮箱">
                  <div v-if="alertConfig.alert_emails.length === 0" style="color: #999">
                    暂无配置的告警邮箱
                  </div>
                  <a-space v-else wrap>
                    <a-tag
                      v-for="email in alertConfig.alert_emails"
                      :key="email"
                      closable
                      color="blue"
                      @close="(e: Event) => removeAlertEmail(email, e)"
                    >
                      {{ email }}
                    </a-tag>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>

            <!-- 服务容量配置 -->
            <a-card title="服务容量配置 (每个 Key 的 RPM 上限)" size="small">
              <a-table :dataSource="serviceLimitsList" :pagination="false" row-key="service" size="small">
                <a-table-column title="服务" dataIndex="service" key="service" :width="150">
                  <template #default="{ record }">
                    {{ serviceDisplayNames[record.service] || record.service }}
                  </template>
                </a-table-column>
                <a-table-column title="单 Key RPM 限制" dataIndex="limit" key="limit" :width="200">
                  <template #default="{ record }">
                    <a-input-number
                      :value="record.limit"
                      :min="100"
                      :max="100000"
                      style="width: 150px"
                      @change="(val: number) => updateServiceLimit(record.service, val)"
                    />
                  </template>
                </a-table-column>
                <a-table-column title="说明" key="desc">
                  <template #default="{ record }">
                    <span style="color: #666; font-size: 12px">
                      配置 N 个 Key 时，总容量 = N × {{ record.limit }} RPM，
                      告警阈值 = N × {{ Math.round(record.limit * alertConfig.threshold_percent / 100) }} RPM ({{ alertConfig.threshold_percent }}%)
                    </span>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>

            <!-- 保存按钮 -->
            <div style="text-align: right">
              <a-button type="primary" :loading="alertSaving" @click="saveAlertConfig">
                保存配置
              </a-button>
            </div>
          </a-space>
        </a-spin>
      </a-tab-pane>
    </a-tabs>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="formLoading"
      width="640px"
      @ok="handleSubmit"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="Name" required>
          <a-input v-model:value="formData.name" placeholder="Enter name" />
        </a-form-item>
        <a-form-item label="Category">
          <a-auto-complete
            v-model:value="formData.category"
            :options="categoryOptions"
            placeholder="Select or enter category"
          />
        </a-form-item>
        <a-form-item label="Photo URL">
          <a-input v-model:value="formData.photo" placeholder="Enter photo URL" />
        </a-form-item>
        <a-form-item label="School">
          <a-input v-model:value="formData.school" placeholder="Enter school" />
        </a-form-item>
        <a-form-item label="Brief">
          <a-textarea v-model:value="formData.brief" placeholder="Enter brief description" :rows="3" />
        </a-form-item>
        <a-form-item label="Highlight Brief">
          <a-textarea v-model:value="formData.highlight_brief" placeholder="Enter highlight brief" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Import Modal -->
    <a-modal
      v-model:open="importModalVisible"
      title="Import Role Models"
      :footer="null"
      width="480px"
    >
      <a-alert
        message="Upload CSV or XLSX file to import role models"
        description="Required columns: name. Optional: category, photo, school, brief, social_media"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />
      <a-upload-dragger
        :custom-request="handleImport"
        :show-upload-list="false"
        accept=".csv,.xlsx"
      >
        <p class="ant-upload-drag-icon">
          <ImportOutlined />
        </p>
        <p class="ant-upload-text">Click or drag file to this area to upload</p>
        <p class="ant-upload-hint">Support CSV and XLSX formats</p>
      </a-upload-dragger>
      <div v-if="importLoading" style="text-align: center; margin-top: 16px">
        <a-spin tip="Importing..." />
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.tools-view {
  padding: 24px;
}

.text-muted {
  color: #999;
}
</style>
