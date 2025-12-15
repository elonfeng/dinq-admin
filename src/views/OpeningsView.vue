<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { openingService } from '@/services/openingService'
import { uploadService } from '@/services/uploadService'
import type {
  Opening,
  OpeningTag,
  OpeningListParams,
  CreateOpeningRequest,
} from '@/types/opening'
import { formatDateTime, formatRelativeTime } from '@/utils/formatter'

const loading = ref(false)
const openings = ref<Opening[]>([])
const total = ref(0)
const lastSyncedAt = ref<string | null>(null)
let fetchRequestId = 0 // 用于追踪最新的请求

const pagination = ref({
  current: 1,
  pageSize: 10,
})

// 筛选条件
const typeFilter = ref<'graduate' | 'internship' | ''>('')
const timeRangeFilter = ref<'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last60days'>('all')
const locationFilter = ref('')
const searchKeyword = ref('')

// 统计数据
const stats = ref({
  total: 0,
  graduate: 0,
  internship: 0,
  last24Hours: 0,
  last7Days: 0,
  byLocation: {} as Record<string, number>,
})

// 弹窗控制
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const currentOpening = ref<Opening | null>(null)

// 表单数据
const formData = ref<CreateOpeningRequest>({
  position: '',
  company: '',
  company_icon: '',
  tags: [],
  location: '',
  description: '',
  email: '',
  author_avatar: '',
  author_name: '',
  user_url: '',
  source: '',
  source_url: '',
  type: 'internship',
})

// 标签输入 - 新的三种标签类型
const opportunityType = ref<'graduate_admission' | 'internships' | ''>('')
const fundingRound = ref('')
const fieldInputValue = ref('')
const fields = ref<string[]>([])

// 融资轮次选项
const fundingRoundOptions = [
  { value: '', label: 'Select' },
  { value: 'Pre-Seed', label: 'Pre-Seed' },
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
  { value: 'Series B', label: 'Series B' },
  { value: 'Series C', label: 'Series C' },
  { value: 'Series D', label: 'Series D' },
  { value: 'Series E', label: 'Series E' },
  { value: 'Series F', label: 'Series F' },
  { value: 'Series G+', label: 'Series G+' },
  { value: 'Pre-IPO', label: 'Pre-IPO' },
  { value: 'IPO', label: 'IPO' },
  { value: 'Public', label: 'Public' },
  { value: 'Acquired', label: 'Acquired' },
  { value: 'Bootstrapped', label: 'Bootstrapped' },
  { value: 'Unknown', label: 'Unknown' },
]

// 机会类型选项
const opportunityTypeOptions = [
  { value: 'graduate_admission', label: 'Graduate Admission' },
  { value: 'internships', label: 'Internships' },
]

// 来源平台选项
const sourcePlatformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X' },
  { value: 'github', label: 'GitHub' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'redbook', label: 'RedBook' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
]

// 来源平台图标映射
const sourceIconMap: Record<string, string> = {
  linkedin: '/LinkedInIcon.svg',
  x: '/XIcon.svg',
  github: '/GithubIcon.svg',
  redbook: '/redbookIcon.svg',
  facebook: '/facebookIcon.svg',
  reddit: '/redditIcon.svg',
}

function getSourceIcon(source: string | undefined): string | null {
  if (!source) return null
  return sourceIconMap[source.toLowerCase()] || null
}

// 详情弹窗
const detailModalOpen = ref(false)
const detailOpening = ref<Opening | null>(null)

// 图标上传状态
const iconUploading = ref(false)
const iconIsUploaded = ref(false) // 标记是否通过上传获得的URL
const iconFileInput = ref<HTMLInputElement | null>(null)

// 头像上传状态
const avatarUploading = ref(false)
const avatarIsUploaded = ref(false)
const avatarFileInput = ref<HTMLInputElement | null>(null)

const typeTagMap = {
  graduate: { color: 'green', label: '全职/研究生' },
  internship: { color: 'blue', label: '实习' },
}

const timeRangeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'last7days', label: '最近7天' },
  { value: 'last30days', label: '最近30天' },
  { value: 'last60days', label: '最近60天' },
]

const columns = [
  { title: '职位', dataIndex: 'position', key: 'position', width: 200 },
  { title: '公司', dataIndex: 'company', key: 'company', width: 150 },
  { title: '地点', dataIndex: 'location', key: 'location', width: 120 },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 200 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
  { title: '更新时间', dataIndex: 'update_time', key: 'update_time', width: 160 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' as const },
]

const locationOptions = computed(() => {
  return Object.keys(stats.value.byLocation).map((loc) => ({
    value: loc,
    label: `${loc} (${stats.value.byLocation[loc]})`,
  }))
})

async function fetchOpenings() {
  const currentRequestId = ++fetchRequestId
  loading.value = true
  try {
    const params: OpeningListParams = {
      page: pagination.value.current,
      page_size: pagination.value.pageSize,
    }
    if (typeFilter.value) {
      params.type = typeFilter.value
    }
    if (timeRangeFilter.value && timeRangeFilter.value !== 'all') {
      params.time_range = timeRangeFilter.value
    }
    if (locationFilter.value) {
      params.locations = locationFilter.value
    }

    const result = await openingService.list(params)
    // 只有最新的请求才更新数据（避免竞态条件）
    if (currentRequestId !== fetchRequestId) return

    openings.value = Array.isArray(result?.list) ? result.list : []
    total.value = result?.total || 0
    lastSyncedAt.value = new Date().toISOString()
  } catch (error) {
    if (currentRequestId !== fetchRequestId) return
    console.error(error)
    message.error('加载职位列表失败')
  } finally {
    if (currentRequestId === fetchRequestId) {
      loading.value = false
    }
  }
}

async function fetchStats() {
  try {
    const result = await openingService.getStats()
    stats.value = result
  } catch (error) {
    console.error(error)
  }
}

function handleTableChange(pag: { current?: number; pageSize?: number }) {
  if (pag.current) {
    pagination.value.current = pag.current
  }
  if (pag.pageSize && pag.pageSize !== pagination.value.pageSize) {
    pagination.value.pageSize = pag.pageSize
    pagination.value.current = 1
  }
  fetchOpenings()
}

function handleRefresh() {
  fetchOpenings()
  fetchStats()
}

function openCreateModal() {
  modalMode.value = 'create'
  formData.value = {
    position: '',
    company: '',
    company_icon: '',
    tags: [],
    location: '',
    description: '',
    email: '',
    author_avatar: '',
    author_name: '',
    user_url: '',
    source: '',
    source_url: '',
    type: 'internship',
  }
  // 重置标签状态
  opportunityType.value = ''
  fundingRound.value = ''
  fields.value = []
  fieldInputValue.value = ''
  // 重置图标上传状态
  iconIsUploaded.value = false
  avatarIsUploaded.value = false
  currentOpening.value = null
  modalOpen.value = true
}

function openEditModal(record: Opening) {
  modalMode.value = 'edit'
  currentOpening.value = record
  formData.value = {
    position: record.position,
    company: record.company,
    company_icon: record.company_icon || '',
    tags: record.tags ? [...record.tags] : [],
    location: record.location,
    description: record.description,
    email: record.email || '',
    author_avatar: record.author_avatar || '',
    author_name: record.author_name || '',
    user_url: record.user_url || '',
    source: record.source || '',
    source_url: record.source_url || '',
    type: record.type,
  }
  // 解析已有标签到表单状态
  parseTagsToForm(record.tags)
  fieldInputValue.value = ''
  // 如果有图标URL，标记为已上传状态（不可编辑，只能清空）
  iconIsUploaded.value = !!record.company_icon
  avatarIsUploaded.value = !!record.author_avatar
  modalOpen.value = true
}

function openDetailModal(record: Opening) {
  detailOpening.value = record
  detailModalOpen.value = true
}

async function submitForm() {
  if (!formData.value.position || !formData.value.company || !formData.value.location) {
    message.error('请填写必填字段：职位、公司、地点')
    return
  }

  // 构建标签数组
  formData.value.tags = buildTagsFromForm()

  submitting.value = true
  try {
    if (modalMode.value === 'create') {
      await openingService.create(formData.value)
      message.success('职位创建成功')
    } else if (currentOpening.value) {
      await openingService.update(currentOpening.value.id, formData.value)
      message.success('职位更新成功')
    }
    modalOpen.value = false
    await fetchOpenings()
    await fetchStats()
  } catch (error) {
    console.error(error)
    message.error(modalMode.value === 'create' ? '创建失败' : '更新失败')
  } finally {
    submitting.value = false
  }
}

function confirmDelete(record: Opening) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除职位「${record.position}」吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await openingService.delete(record.id)
        message.success('删除成功')
        fetchOpenings()
        fetchStats()
      } catch (error) {
        console.error(error)
        message.error('删除失败')
      }
    },
  })
}

// 添加领域标签
function addField() {
  const value = fieldInputValue.value.trim()
  if (!value) return
  if (fields.value.length >= 3) {
    message.warning('最多添加 3 个领域标签，请先删除再添加')
    return
  }
  if (fields.value.includes(value)) {
    message.warning('该领域已添加')
    return
  }
  fields.value.push(value)
  fieldInputValue.value = ''
}

// 移除领域标签
function removeField(index: number) {
  fields.value.splice(index, 1)
}

// 从表单数据构建标签数组
function buildTagsFromForm(): OpeningTag[] {
  const tags: OpeningTag[] = []

  // 机会类型标签
  if (opportunityType.value) {
    const label = opportunityType.value === 'graduate_admission' ? 'Graduate Admission' : 'Internships'
    tags.push({ label, type: 'primary' })
  }

  // 融资轮次标签
  if (fundingRound.value) {
    tags.push({ label: fundingRound.value, type: 'secondary' })
  }

  // 领域标签
  fields.value.forEach(field => {
    tags.push({ label: field, type: 'outline' })
  })

  return tags
}

// 从标签数组解析到表单状态
function parseTagsToForm(tags: OpeningTag[] | undefined) {
  opportunityType.value = ''
  fundingRound.value = ''
  fields.value = []

  if (!tags || tags.length === 0) return

  tags.forEach(tag => {
    // 检查是否是机会类型
    if (tag.label === 'Graduate Admission') {
      opportunityType.value = 'graduate_admission'
    } else if (tag.label === 'Internships') {
      opportunityType.value = 'internships'
    }
    // 检查是否是融资轮次
    else if (fundingRoundOptions.some(opt => opt.value === tag.label)) {
      fundingRound.value = tag.label
    }
    // 其他视为领域标签
    else {
      fields.value.push(tag.label)
    }
  })
}

function getTagColor(type: string) {
  switch (type) {
    case 'primary':
      return 'blue'
    case 'secondary':
      return 'purple'
    case 'outline':
      return 'default'
    default:
      return 'default'
  }
}

// 触发文件选择
function triggerIconUpload() {
  iconFileInput.value?.click()
}

// 处理图标上传
async function handleIconUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件类型 (仅支持 png, jpg, webp)
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.error('仅支持 PNG、JPG、WebP 格式的图片')
    return
  }

  // 验证文件大小 (最大 2MB)
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB')
    return
  }

  iconUploading.value = true
  try {
    const url = await uploadService.uploadFile(file)
    formData.value.company_icon = url
    iconIsUploaded.value = true
    message.success('图标上传成功')
  } catch (error) {
    console.error(error)
    message.error('图标上传失败')
  } finally {
    iconUploading.value = false
    // 清空 input 以便重复选择同一文件
    input.value = ''
  }
}

// 清空图标
function clearIcon() {
  formData.value.company_icon = ''
  iconIsUploaded.value = false
}

// 触发头像文件选择
function triggerAvatarUpload() {
  avatarFileInput.value?.click()
}

// 处理头像上传
async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件类型 (仅支持 png, jpg, webp)
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.error('仅支持 PNG、JPG、WebP 格式的图片')
    return
  }

  // 验证文件大小 (最大 2MB)
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB')
    return
  }

  avatarUploading.value = true
  try {
    const url = await uploadService.uploadFile(file)
    formData.value.author_avatar = url
    avatarIsUploaded.value = true
    message.success('头像上传成功')
  } catch (error) {
    console.error(error)
    message.error('头像上传失败')
  } finally {
    avatarUploading.value = false
    // 清空 input 以便重复选择同一文件
    input.value = ''
  }
}

// 清空头像
function clearAvatar() {
  formData.value.author_avatar = ''
  avatarIsUploaded.value = false
}

watch([typeFilter, timeRangeFilter, locationFilter], () => {
  pagination.value.current = 1
  fetchOpenings()
})

onMounted(() => {
  fetchOpenings()
  fetchStats()
})
</script>

<template>
  <div class="openings-page">
    <div class="page-header">
      <div class="title">
        <TeamOutlined style="font-size: 32px; color: #1890ff" />
        <div>
          <h2>职位管理</h2>
          <p>管理招聘职位信息</p>
        </div>
      </div>
      <div class="actions">
        <span v-if="lastSyncedAt" class="last-updated">
          最近刷新：{{ formatRelativeTime(lastSyncedAt) }}
        </span>
        <a-button type="primary" @click="openCreateModal">
          <template #icon>
            <PlusOutlined />
          </template>
          新增职位
        </a-button>
        <a-button type="default" @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <div class="summary-cards">
      <a-card bordered class="summary-card total">
        <div class="label">总职位数</div>
        <div class="value">{{ stats.total ?? 0 }}</div>
      </a-card>
      <a-card bordered class="summary-card graduate">
        <div class="label">全职/研究生</div>
        <div class="value">{{ stats.graduate ?? 0 }}</div>
      </a-card>
      <a-card bordered class="summary-card internship">
        <div class="label">实习</div>
        <div class="value">{{ stats.internship ?? 0 }}</div>
      </a-card>
      <a-card bordered class="summary-card recent">
        <div class="label">24小时内</div>
        <div class="value">{{ stats.last24Hours ?? 0 }}</div>
      </a-card>
      <a-card bordered class="summary-card week">
        <div class="label">7天内</div>
        <div class="value">{{ stats.last7Days ?? 0 }}</div>
      </a-card>
    </div>

    <a-card class="table-card">
      <div class="table-toolbar">
        <a-space wrap>
          <a-select
            v-model:value="typeFilter"
            placeholder="职位类型"
            style="width: 140px"
            allow-clear
          >
            <a-select-option value="">全部类型</a-select-option>
            <a-select-option value="graduate">全职/研究生</a-select-option>
            <a-select-option value="internship">实习</a-select-option>
          </a-select>
          <a-select
            v-model:value="timeRangeFilter"
            placeholder="时间范围"
            style="width: 140px"
          >
            <a-select-option
              v-for="opt in timeRangeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </a-select-option>
          </a-select>
          <a-select
            v-model:value="locationFilter"
            placeholder="工作地点"
            style="width: 160px"
            allow-clear
            show-search
          >
            <a-select-option value="">全部地点</a-select-option>
            <a-select-option
              v-for="opt in locationOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="openings"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        :scroll="{ x: 1200, y: '57vh'}"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'position'">
            <div class="position-cell">
              <a class="position-link" @click="openDetailModal(record)">
                {{ record.position }}
              </a>
              <div class="company-info">
                <img
                  v-if="record.company_icon"
                  :src="record.company_icon"
                  class="company-icon"
                  :alt="record.company"
                />
                <span class="company-name">{{ record.company }}</span>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'company'">
            <div class="company-cell">
              <img
                v-if="record.company_icon"
                :src="record.company_icon"
                class="company-icon"
                :alt="record.company"
              />
              <span>{{ record.company }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'location'">
            <span>
              <EnvironmentOutlined style="margin-right: 4px; color: #8c8c8c" />
              {{ record.location }}
            </span>
          </template>
          <template v-else-if="column.key === 'tags'">
            <div class="tags-cell">
              <a-tag
                v-for="(tag, idx) in (record.tags || []).slice(0, 3)"
                :key="idx"
                :color="getTagColor(tag.type)"
                size="small"
              >
                {{ tag.label }}
              </a-tag>
              <a-tag v-if="(record.tags || []).length > 3" size="small">
                +{{ record.tags.length - 3 }}
              </a-tag>
            </div>
          </template>
          <template v-else-if="column.key === 'source'">
            <a
              v-if="record.source_url"
              :href="record.source_url"
              target="_blank"
              rel="noopener noreferrer"
              class="source-link"
            >
              <img
                v-if="getSourceIcon(record.source)"
                :src="getSourceIcon(record.source) || ''"
                :alt="record.source"
                class="source-icon"
              />
              <LinkOutlined v-else />
            </a>
            <template v-else>
              <img
                v-if="getSourceIcon(record.source)"
                :src="getSourceIcon(record.source) || ''"
                :alt="record.source"
                class="source-icon"
              />
              <span v-else>{{ record.source || '-' }}</span>
            </template>
          </template>
          <template v-else-if="column.key === 'update_time'">
            <div class="time-cell">
              <ClockCircleOutlined style="margin-right: 4px; color: #8c8c8c" />
              <div>
                <div class="primary">{{ formatDateTime(record.update_time || record.created_at) }}</div>
                <div class="secondary">{{ formatRelativeTime(record.update_time || record.created_at) }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openEditModal(record)">
                <template #icon>
                  <EditOutlined />
                </template>
                编辑
              </a-button>
              <a-button type="link" size="small" danger @click="confirmDelete(record)">
                <template #icon>
                  <DeleteOutlined />
                </template>
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalMode === 'create' ? '新增职位' : '编辑职位'"
      :confirm-loading="submitting"
      width="720px"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitForm"
    >
      <a-form layout="vertical" class="opening-form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="职位名称" required>
              <a-input v-model:value="formData.position" placeholder="如：ML Research Intern" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工作地点" required>
              <a-input v-model:value="formData.location" placeholder="如：USA, Remote" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="公司名称" required>
              <a-input v-model:value="formData.company" placeholder="如：OpenAI" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="投递邮箱">
              <a-input v-model:value="formData.email" placeholder="jobs@company.com" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="公司图标 URL">
          <div class="icon-upload-wrapper">
            <a-input
              v-model:value="formData.company_icon"
              placeholder="https://..."
              :disabled="iconIsUploaded"
              :allow-clear="iconIsUploaded"
              @clear="clearIcon"
            />
            <a-button
              type="primary"
              :loading="iconUploading"
              @click="triggerIconUpload"
            >
              <template #icon>
                <UploadOutlined />
              </template>
              上传
            </a-button>
            <input
              ref="iconFileInput"
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              style="display: none"
              @change="handleIconUpload"
            />
          </div>
        </a-form-item>

        <a-form-item label="职位描述">
          <a-textarea
            v-model:value="formData.description"
            :rows="4"
            placeholder="职位描述信息..."
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="来源平台">
              <a-select
                v-model:value="formData.source"
                placeholder="请选择来源平台"
                style="width: 100%"
                allow-clear
              >
                <a-select-option
                  v-for="opt in sourcePlatformOptions"
                  :key="opt.value"
                  :value="opt.value === 'other' ? '' : opt.value"
                >
                  {{ opt.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源链接">
              <a-input v-model:value="formData.source_url" placeholder="https://..." />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="发布者名称">
              <a-input v-model:value="formData.author_name" placeholder="发布者名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="用户主页 URL">
              <a-input v-model:value="formData.user_url" placeholder="https://..." />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="发布者头像 URL">
          <div class="icon-upload-wrapper">
            <a-input
              v-model:value="formData.author_avatar"
              placeholder="https://..."
              :disabled="avatarIsUploaded"
              :allow-clear="avatarIsUploaded"
              @clear="clearAvatar"
            />
            <a-button
              type="primary"
              :loading="avatarUploading"
              @click="triggerAvatarUpload"
            >
              <template #icon>
                <UploadOutlined />
              </template>
              上传
            </a-button>
            <input
              ref="avatarFileInput"
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              style="display: none"
              @change="handleAvatarUpload"
            />
          </div>
        </a-form-item>

        <a-divider orientation="left" style="margin: 16px 0 8px">标签设置</a-divider>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="机会类型">
              <a-radio-group v-model:value="opportunityType">
                <a-radio
                  v-for="opt in opportunityTypeOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="企业融资轮次">
              <a-select
                v-model:value="fundingRound"
                placeholder="请选择融资轮次"
                style="width: 100%"
                allow-clear
              >
                <a-select-option
                  v-for="opt in fundingRoundOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="领域/方向">
          <div class="fields-editor">
            <div class="current-fields">
              <a-tag
                v-for="(field, idx) in fields"
                :key="idx"
                color="default"
                closable
                @close="removeField(idx)"
              >
                {{ field }}
              </a-tag>
              <span v-if="fields.length === 0" class="empty-hint">暂无领域标签</span>
            </div>
            <div class="add-field">
              <a-input
                v-model:value="fieldInputValue"
                placeholder="输入领域/方向，如：AI、NLP、CV"
                style="flex: 1"
                @press-enter="addField"
              />
              <a-button type="dashed" @click="addField">
                <PlusOutlined />
                添加
              </a-button>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailModalOpen"
      :title="detailOpening?.position"
      :footer="null"
      width="640px"
    >
      <div v-if="detailOpening" class="detail-content">
        <div class="detail-header">
          <div class="company-info">
            <img
              v-if="detailOpening.company_icon"
              :src="detailOpening.company_icon"
              class="company-icon-large"
              :alt="detailOpening.company"
            />
            <div>
              <h3>{{ detailOpening.company }}</h3>
              <div class="meta">
                <span>
                  <EnvironmentOutlined />
                  {{ detailOpening.location }}
                </span>
                <a-tag :color="typeTagMap[detailOpening.type as keyof typeof typeTagMap]?.color">
                  {{ typeTagMap[detailOpening.type as keyof typeof typeTagMap]?.label }}
                </a-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-tags" v-if="detailOpening.tags?.length">
          <a-tag
            v-for="(tag, idx) in detailOpening.tags"
            :key="idx"
            :color="getTagColor(tag.type)"
          >
            {{ tag.label }}
          </a-tag>
        </div>

        <div class="detail-section">
          <h4>职位描述</h4>
          <p>{{ detailOpening.description || '暂无描述' }}</p>
        </div>

        <a-divider />

        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="投递邮箱">
            <a v-if="detailOpening.email" :href="`mailto:${detailOpening.email}`">
              {{ detailOpening.email }}
            </a>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="来源">
            <a
              v-if="detailOpening.source_url"
              :href="detailOpening.source_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkOutlined />
              {{ detailOpening.source || '查看原文' }}
            </a>
            <span v-else>{{ detailOpening.source || '-' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="发布者">
            <div v-if="detailOpening.author_name" class="author-info">
              <a-avatar
                v-if="detailOpening.author_avatar"
                :src="detailOpening.author_avatar"
                :size="20"
              />
              {{ detailOpening.author_name }}
            </div>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDateTime(detailOpening.update_time || detailOpening.created_at) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.openings-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: calc(100vh - 114px);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.title p {
  margin: 0;
  color: #8c8c8c;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-updated {
  color: #8c8c8c;
  font-size: 13px;
}

.summary-cards {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  flex: 1;
  border-radius: 12px;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-card .label {
  color: #8c8c8c;
  margin-bottom: 8px;
}

.summary-card .value {
  font-size: 28px;
  font-weight: 600;
}

.summary-card.total .value {
  color: #1890ff;
}

.summary-card.graduate .value {
  color: #52c41a;
}

.summary-card.internship .value {
  color: #1890ff;
}

.summary-card.recent .value {
  color: #fa8c16;
}

.summary-card.week .value {
  color: #722ed1;
}

.table-card {
  margin-top: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.position-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.position-link {
  font-weight: 500;
  color: #1890ff;
  cursor: pointer;
}

.position-link:hover {
  text-decoration: underline;
}

.company-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.company-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
}

.company-name {
  color: #8c8c8c;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.source-link {
  color: #1890ff;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.source-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.time-cell {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.time-cell .primary {
  font-size: 13px;
}

.time-cell .secondary {
  color: #8c8c8c;
  font-size: 12px;
}

.opening-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.fields-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.current-fields .empty-hint {
  color: #bfbfbf;
  font-size: 13px;
}

.add-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.detail-content {
  padding: 8px 0;
}

.detail-header {
  margin-bottom: 16px;
}

.detail-header .company-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.company-icon-large {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
}

.detail-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.detail-header .meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #8c8c8c;
}

.detail-tags {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-section {
  margin: 16px 0;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.detail-section p {
  margin: 0;
  color: #595959;
  line-height: 1.6;
  white-space: pre-wrap;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-upload-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-upload-wrapper .ant-input-affix-wrapper,
.icon-upload-wrapper .ant-input {
  flex: 1;
}
</style>
