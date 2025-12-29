<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { contactRequestService } from '@/services/contactRequestService'
import type { ContactRequest, ContactRequestStatus } from '@/types/contactRequest'
import { formatDateTime, formatRelativeTime } from '@/utils/formatter'

type StatusFilter = 'all' | ContactRequestStatus

const loading = ref(false)
const entries = ref<ContactRequest[]>([])
const total = ref(0)
const lastSyncedAt = ref<string | null>(null)

const pagination = ref({
  current: 1,
  pageSize: 20,
})

const statusFilter = ref<StatusFilter>('all')

const statusTagMap: Record<ContactRequestStatus, { color: string; label: string }> = {
  pending: { color: 'gold', label: '待处理' },
  processing: { color: 'blue', label: '处理中' },
  resolved: { color: 'green', label: '已解决' },
}

const allowedStatuses: ContactRequestStatus[] = ['pending', 'processing', 'resolved']

const getStatusMeta = (status: string) => {
  const normalized = allowedStatuses.includes(status as ContactRequestStatus)
    ? (status as ContactRequestStatus)
    : 'pending'
  return statusTagMap[normalized]
}

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
]

const reasonLabels: Record<string, string> = {
  business: '商务合作',
  feedback: '产品反馈',
  support: '技术支持',
  media: '媒体咨询',
  other: '其他',
}

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 150 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
  { title: '所属机构', dataIndex: 'affiliation', key: 'affiliation' },
  { title: '联系原因', dataIndex: 'reason', key: 'reason', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 160 },
]

const statusCounters = computed(() => {
  return entries.value.reduce(
    (acc, item) => {
      acc[item.status] += 1
      return acc
    },
    { pending: 0, processing: 0, resolved: 0 }
  )
})

const selectedEntry = ref<ContactRequest | null>(null)
const statusModalOpen = ref(false)
const statusUpdating = ref(false)
const statusToUpdate = ref<ContactRequestStatus>('pending')

const detailModalOpen = ref(false)
const detailEntry = ref<ContactRequest | null>(null)

async function fetchList() {
  loading.value = true
  try {
    const { items, total: totalCount } = await contactRequestService.list({
      status: statusFilter.value,
      limit: pagination.value.pageSize,
      offset: (pagination.value.current - 1) * pagination.value.pageSize,
    })
    entries.value = items
    total.value = totalCount
    lastSyncedAt.value = new Date().toISOString()
  } catch (error) {
    console.error(error)
    message.error('加载联系请求列表失败，请稍后重试')
  } finally {
    loading.value = false
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
  fetchList()
}

function handleRefresh() {
  fetchList()
}

function openStatusModal(entry: ContactRequest) {
  selectedEntry.value = entry
  statusToUpdate.value = entry.status
  statusModalOpen.value = true
}

function openDetailModal(entry: ContactRequest) {
  detailEntry.value = entry
  detailModalOpen.value = true
}

async function submitStatusUpdate() {
  if (!selectedEntry.value) return
  statusUpdating.value = true
  try {
    await contactRequestService.updateStatus(selectedEntry.value.id, statusToUpdate.value)
    message.success('状态更新成功')
    statusModalOpen.value = false
    await fetchList()
  } catch (error) {
    console.error(error)
    message.error('状态更新失败，请稍后重试')
  } finally {
    statusUpdating.value = false
  }
}

watch(statusFilter, () => {
  pagination.value.current = 1
  fetchList()
})

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="contact-request-page">
    <div class="page-header">
      <div class="title">
        <MessageOutlined />
        <div>
          <h2>联系请求</h2>
          <p>查看和管理用户的联系请求</p>
        </div>
      </div>
      <div class="actions">
        <span v-if="lastSyncedAt" class="last-updated">
          最近刷新：{{ formatRelativeTime(lastSyncedAt) }}
        </span>
        <a-button type="default" @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <a-row :gutter="[16, 16]" class="summary-cards">
      <a-col :xs="24" :sm="8">
        <a-card bordered class="summary-card pending">
          <div class="label">待处理</div>
          <div class="value">{{ statusCounters.pending }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card bordered class="summary-card processing">
          <div class="label">处理中</div>
          <div class="value">{{ statusCounters.processing }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card bordered class="summary-card resolved">
          <div class="label">已解决</div>
          <div class="value">{{ statusCounters.resolved }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="table-card" :loading="loading">
      <div class="table-toolbar">
        <a-select
          v-model:value="statusFilter"
          style="width: 180px"
          :options="statusOptions"
          placeholder="状态过滤"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="entries"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="user-cell">
              <div class="primary">{{ record.name }}</div>
              <div class="secondary">{{ record.jobTitle }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'affiliation'">
            <div class="primary">{{ record.affiliation }}</div>
            <div class="secondary">{{ record.country }}</div>
          </template>
          <template v-else-if="column.key === 'reason'">
            {{ reasonLabels[record.reason] || record.reason }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusMeta(record.status).color" class="status-tag">
              {{ getStatusMeta(record.status).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            <div class="primary">{{ formatDateTime(record.createdAt) }}</div>
            <div class="secondary">{{ formatRelativeTime(record.createdAt) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openDetailModal(record)">详情</a-button>
              <a-button type="link" size="small" @click="openStatusModal(record)">修改状态</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 修改状态弹窗 -->
    <a-modal
      v-model:open="statusModalOpen"
      title="更新联系请求状态"
      :confirm-loading="statusUpdating"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitStatusUpdate"
    >
      <div v-if="selectedEntry" class="modal-content">
        <div class="field">
          <div class="label">申请人</div>
          <div class="value">{{ selectedEntry.name }} · {{ selectedEntry.email }}</div>
        </div>
        <div class="field">
          <div class="label">联系原因</div>
          <div class="value">{{ reasonLabels[selectedEntry.reason] || selectedEntry.reason }}</div>
        </div>
        <a-radio-group v-model:value="statusToUpdate" class="status-radio-group">
          <a-radio value="pending">待处理</a-radio>
          <a-radio value="processing">处理中</a-radio>
          <a-radio value="resolved">已解决</a-radio>
        </a-radio-group>
      </div>
    </a-modal>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailModalOpen"
      title="联系请求详情"
      :footer="null"
      width="600px"
    >
      <div v-if="detailEntry" class="modal-content detail-modal">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="姓名">{{ detailEntry.name }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ detailEntry.email }}</a-descriptions-item>
          <a-descriptions-item label="所属机构">{{ detailEntry.affiliation }}</a-descriptions-item>
          <a-descriptions-item label="职位">{{ detailEntry.jobTitle }}</a-descriptions-item>
          <a-descriptions-item label="国家/地区">{{ detailEntry.country }}</a-descriptions-item>
          <a-descriptions-item label="联系原因">
            {{ reasonLabels[detailEntry.reason] || detailEntry.reason }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusMeta(detailEntry.status).color">
              {{ getStatusMeta(detailEntry.status).label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="提交时间">
            {{ formatDateTime(detailEntry.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="详细说明" :span="2">
            <div class="details-content">{{ detailEntry.details || '无' }}</div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.contact-request-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: calc(100vh - 64px);
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

.summary-card {
  border-radius: 12px;
  min-height: 110px;
}

.summary-card .label {
  color: #8c8c8c;
  margin-bottom: 8px;
}

.summary-card .value {
  font-size: 28px;
  font-weight: 600;
}

.summary-card.pending .value {
  color: #faad14;
}

.summary-card.processing .value {
  color: #1890ff;
}

.summary-card.resolved .value {
  color: #52c41a;
}

.table-card {
  margin-top: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.user-cell .primary {
  font-weight: 500;
}

.user-cell .secondary,
.secondary {
  color: #8c8c8c;
  font-size: 12px;
}

.status-tag {
  text-transform: none;
}

.modal-content .field {
  margin-bottom: 12px;
}

.modal-content .label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.modal-content .value {
  font-weight: 500;
}

.status-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.detail-modal .details-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>
