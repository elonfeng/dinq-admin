<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons-vue'
import { verificationService } from '@/services/verificationService'
import type { VerificationRecord } from '@/types/verification'
import { formatRelativeTime } from '@/utils/formatter'

type ReviewMode = 'approve' | 'reject'

const loading = ref(false)
const reviewSubmitting = ref(false)
const records = ref<VerificationRecord[]>([])
const fetchError = ref<string | null>(null)

const selectedRecord = ref<VerificationRecord | null>(null)
const detailDrawerOpen = ref(false)
const reviewModalOpen = ref(false)
const reviewMode = ref<ReviewMode>('approve')
const reviewerNotes = ref('')

const filterType = ref<'all' | 'career' | 'education' | 'social'>('all')
const statusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')

const columns = [
  { title: '用户', dataIndex: 'user', key: 'user' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 140 },
  { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 200 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '操作', key: 'actions', width: 220 },
]

const typeFilterOptions = [
  { label: '全部', value: 'all' },
  { label: '职业认证', value: 'career' },
  { label: '教育认证', value: 'education' },
  { label: '社媒认证', value: 'social' },
]

const statusFilterOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]

const statusTagMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待审核' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
}

const typeLabelMap: Record<string, string> = {
  career: '职业认证',
  education: '教育认证',
  social: '社媒认证',
}

const filteredRecords = computed(() => {
  if (filterType.value === 'all') {
    return records.value
  }
  return records.value.filter((record) => record.type === filterType.value)
})

const stats = computed(() => {
  const grouped = records.value.reduce(
    (acc, record) => {
      acc.total += 1
      if (record.type in acc.byType) {
        acc.byType[record.type as keyof typeof acc.byType] += 1
      }
      return acc
    },
    { total: 0, byType: { career: 0, education: 0, social: 0 } }
  )

  return grouped
})

const formatBooleanDisplay = (value?: boolean) => {
  if (value === undefined || value === null) {
    return '—'
  }
  return value ? '是' : '否'
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

const userDisplayName = (record?: VerificationRecord | null) => {
  if (!record) return '—'
  return (
    record.user?.name ||
    record.user?.username ||
    record.user?.email ||
    record.userId ||
    '—'
  )
}

const userSecondaryLine = (record?: VerificationRecord | null) => {
  if (!record) return '—'
  const email = record.user?.email || '未提供邮箱'
  const identifier =
    record.user?.username || record.user?.id || record.userId || '未知ID'
  return `${identifier} · ${email}`
}

type DetailSection = {
  title: string
  items: { label: string; value?: string; isLink?: boolean }[]
}

const detailSections = computed<DetailSection[]>(() => {
  if (!selectedRecord.value) return []
  const record = selectedRecord.value
  const sections: DetailSection[] = [
    {
      title: '基本信息',
      items: [
        { label: '用户名', value: record.user?.username || '未提供用户名' },
        { label: '姓名', value: record.user?.name || '—' },
        { label: '用户ID', value: record.userId || record.user?.id || '—' },
        { label: '邮箱', value: record.user?.email || '未提供邮箱' },
        { label: '类型', value: formatTypeLabel(record.type) },
        { label: '提交时间', value: formatDateTime(record.submittedAt) },
        { label: '当前状态', value: getStatusTag(record.status).label },
      ],
    },
  ]

  const data = record.data || {}

  if (record.type === 'career') {
    sections.push({
      title: '职业信息',
      items: [
        { label: '公司', value: data.company || data.Company || '—' },
        { label: '职位', value: data.job_title || data.JobTitle || '—' },
        { label: '企业邮箱', value: data.verification_email || data.VerificationEmail || '—' },
        {
          label: '邮箱已验证',
          value: formatBooleanDisplay(
            data.verification_email_verified ?? data.VerificationEmailVerified
          ),
        },
      ],
    })
  } else if (record.type === 'education') {
    sections.push({
      title: '教育信息',
      items: [
        { label: '学校', value: data.university || data.University || '—' },
        { label: '院系', value: data.department || data.Department || '—' },
        { label: '学位', value: data.degree || data.Degree || '—' },
        { label: '学生类型', value: data.student_type || data.StudentType || '—' },
        {
          label: '入学时间',
          value: data.enroll_year
            ? `${data.enroll_year}${data.enroll_month ? `/${data.enroll_month}` : ''}`
            : data.EnrollYear || '—',
        },
        { label: '教育邮箱', value: data.verification_email || data.VerificationEmail || '—' },
        {
          label: '邮箱已验证',
          value: formatBooleanDisplay(
            data.verification_email_verified ?? data.VerificationEmailVerified
          ),
        },
      ],
    })
  } else if (record.type === 'social') {
    sections.push({
      title: '社交账号信息',
      items: [
        { label: '平台', value: data.platform || data.Platform || '—' },
        {
          label: '账号',
          value: data.platform_username || data.username || data.PlatformUsername || '—',
        },
        {
          label: '关联链接',
          value: data.profile_url || data.url || data.link || data.ProfileURL,
          isLink: true,
        },
      ],
    })
  } else if (Object.keys(data).length > 0) {
    sections.push({
      title: '附加信息',
      items: Object.entries(data).map(([key, value]) => ({
        label: key,
        value: String(value ?? '—'),
      })),
    })
  }

  return sections
})

const selectedDocuments = computed(() => selectedRecord.value?.documents || [])

const reviewTitle = computed(() =>
  reviewMode.value === 'approve' ? '通过认证' : '拒绝认证'
)

function openDocument(url?: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

async function fetchVerifications() {
  loading.value = true
  fetchError.value = null
  try {
    const { items } = await verificationService.getVerifications({
      status: statusFilter.value,
    })
    records.value = items
  } catch (error: any) {
    const reason = error?.response?.data?.message || error?.message || '获取认证列表失败'
    fetchError.value = reason
    message.error(reason)
  } finally {
    loading.value = false
  }
}

function formatTypeLabel(type: string) {
  return typeLabelMap[type] || type
}

function formatSubmittedAt(record: VerificationRecord) {
  if (!record.submittedAt) return '—'
  return formatRelativeTime(record.submittedAt)
}

function getStatusTag(status: string) {
  return statusTagMap[status] || { color: 'default', label: status }
}

function openDetail(record: VerificationRecord) {
  selectedRecord.value = record
  detailDrawerOpen.value = true
}

function closeDetail() {
  detailDrawerOpen.value = false
}

function openReview(record: VerificationRecord, mode: ReviewMode) {
  selectedRecord.value = record
  reviewMode.value = mode
  reviewerNotes.value = ''
  reviewModalOpen.value = true
}

function closeReviewModal() {
  reviewModalOpen.value = false
}

async function submitReview() {
  if (!selectedRecord.value) {
    message.error('未选择审核条目')
    return
  }

  if (reviewMode.value === 'reject' && reviewerNotes.value.trim().length === 0) {
    message.warning('拒绝审核需填写原因')
    return
  }

  reviewSubmitting.value = true

  try {
    await verificationService.reviewVerification({
      verificationId: selectedRecord.value.verificationId,
      status: reviewMode.value === 'approve' ? 'approved' : 'rejected',
      reviewerNotes: reviewerNotes.value.trim() || undefined,
    })

    message.success(reviewMode.value === 'approve' ? '认证审核通过' : '认证已拒绝')
    await fetchVerifications()
    closeReviewModal()
    detailDrawerOpen.value = false
  } catch (error: any) {
    const reason = error?.response?.data?.message || error?.message || '审核操作失败'
    message.error(reason)
  } finally {
    reviewSubmitting.value = false
  }
}

watch(statusFilter, () => {
  fetchVerifications()
})

onMounted(() => {
  fetchVerifications()
})
</script>

<template>
  <div class="verification-view">
    <div class="page-header">
      <div class="header-content">
        <a-typography-title :level="2">
          <SafetyCertificateOutlined />
          认证审核
        </a-typography-title>
        <a-typography-paragraph type="secondary">
          查看并审核用户提交的职业 / 教育 / 社媒认证
        </a-typography-paragraph>
      </div>
      <div class="header-actions">
        <a-segmented
          v-model:value="statusFilter"
          :options="statusFilterOptions"
          size="middle"
        />
        <a-segmented
          v-model:value="filterType"
          :options="typeFilterOptions"
          size="middle"
        />
        <a-button type="primary" :loading="loading" @click="fetchVerifications">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <a-alert
      v-if="fetchError"
      type="error"
      show-icon
      closable
      :message="fetchError"
      style="margin-bottom: 18px"
      @close="fetchError = null"
    />

    <div class="stats-grid">
      <a-card class="stat-card" :bordered="false">
        <a-statistic title="记录总数" :value="stats.total" />
      </a-card>
      <a-card class="stat-card" :bordered="false">
        <a-statistic title="职业" :value="stats.byType.career" />
      </a-card>
      <a-card class="stat-card" :bordered="false">
        <a-statistic title="教育" :value="stats.byType.education" />
      </a-card>
      <a-card class="stat-card" :bordered="false">
        <a-statistic title="社媒" :value="stats.byType.social" />
      </a-card>
    </div>

    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="filteredRecords"
        :loading="loading"
        :row-key="(record: VerificationRecord) => record.verificationId"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="user-cell">
              <div class="user-name">{{ userDisplayName(record) }}</div>
              <div class="user-meta">{{ userSecondaryLine(record) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'type'">
            <a-tag color="blue">{{ formatTypeLabel(record.type) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'submittedAt'">
            <span>{{ formatSubmittedAt(record) }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusTag(record.status).color">
              {{ getStatusTag(record.status).label }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <div class="action-buttons">
              <a-button size="small" @click="openDetail(record)">
                <template #icon>
                  <InfoCircleOutlined />
                </template>
                详情
              </a-button>
              <template v-if="record.status === 'pending'">
                <a-button
                  size="small"
                  type="primary"
                  ghost
                  @click="openReview(record, 'approve')"
                >
                  <template #icon>
                    <CheckCircleOutlined />
                  </template>
                  通过
                </a-button>
                <a-button
                  size="small"
                  danger
                  ghost
                  @click="openReview(record, 'reject')"
                >
                  <template #icon>
                    <CloseCircleOutlined />
                  </template>
                  拒绝
                </a-button>
              </template>
            </div>
          </template>
        </template>
      </a-table>

      <a-empty v-if="!loading && filteredRecords.length === 0" style="margin-top: 32px">
        <template #description>暂无认证记录</template>
      </a-empty>
    </a-card>

    <a-drawer
      :open="detailDrawerOpen"
      :title="`${formatTypeLabel(selectedRecord?.type || 'career')}详情`"
      width="520"
      @close="closeDetail"
    >
      <template v-if="selectedRecord">
        <div
          v-for="section in detailSections"
          :key="section.title"
          class="detail-section"
        >
          <h3 class="detail-section__title">{{ section.title }}</h3>
          <a-descriptions column="1" size="small" bordered>
            <a-descriptions-item
              v-for="item in section.items"
              :key="item.label"
              :label="item.label"
            >
              <template v-if="item.isLink && item.value">
                <a :href="item.value" target="_blank" rel="noopener">{{ item.value }}</a>
              </template>
              <template v-else>
                {{ item.value || '—' }}
              </template>
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <a-divider>证明材料</a-divider>
        <div v-if="selectedDocuments.length" class="document-list">
          <a-tag
            v-for="(doc, index) in selectedDocuments"
            :key="doc || index"
            color="geekblue"
            @click="openDocument(doc)"
          >
            <template #icon>
              <FileTextOutlined />
            </template>
            {{ doc || `附件${index + 1}` }}
          </a-tag>
        </div>
        <a-empty v-else description="暂无附件" />
      </template>
    </a-drawer>

    <a-modal
      :open="reviewModalOpen"
      :title="reviewTitle"
      :confirm-loading="reviewSubmitting"
      ok-text="提交"
      cancel-text="取消"
      @ok="submitReview"
      @cancel="closeReviewModal"
    >
      <p>
        {{ reviewMode === 'approve' ? '确认通过该认证申请？' : '确认拒绝该认证申请？' }}
      </p>
      <a-form layout="vertical">
        <a-form-item label="审核备注">
          <a-textarea
            v-model:value="reviewerNotes"
            :placeholder="reviewMode === 'reject' ? '请输入拒绝原因' : '可选，填写说明'"
            :auto-size="{ minRows: 3, maxRows: 5 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.verification-view {
  padding: 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-content h2 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card :deep(.ant-statistic-title) {
  font-size: 13px;
  color: #8c8c8c;
}

.stat-card :deep(.ant-statistic-content-value) {
  font-size: 22px;
  font-weight: 600;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.user-meta {
  font-size: 12px;
  color: #8c8c8c;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.document-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

:deep(.ant-tag) {
  cursor: pointer;
}

@media (max-width: 768px) {
  .verification-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
