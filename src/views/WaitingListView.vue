<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, TeamOutlined, SendOutlined } from '@ant-design/icons-vue'
import { waitingListService } from '@/services/waitingListService'
import { invitationCodeService } from '@/services/invitationCodeService'
import type { WaitingListEntry, WaitingListStatus } from '@/types/waitingList'
import { formatDateTime, formatRelativeTime } from '@/utils/formatter'

type StatusFilter = 'all' | WaitingListStatus

const loading = ref(false)
const entries = ref<WaitingListEntry[]>([])
const total = ref(0)
const lastSyncedAt = ref<string | null>(null)

const pagination = ref({
  current: 1,
  pageSize: 20,
})

const statusFilter = ref<StatusFilter>('all')

const statusTagMap: Record<WaitingListStatus, { color: string; label: string }> = {
  pending: { color: 'gold', label: '待处理' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
}

const allowedStatuses: WaitingListStatus[] = ['pending', 'approved', 'rejected']

const getStatusMeta = (status: string) => {
  const normalized = allowedStatuses.includes(status as WaitingListStatus)
    ? (status as WaitingListStatus)
    : 'pending'
  return statusTagMap[normalized]
}

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]

const columns = [
  { title: '申请人', dataIndex: 'fullName', key: 'fullName' },
  { title: '组织 / 职位', dataIndex: 'organization', key: 'organization' },
  { title: '地区', dataIndex: 'country', key: 'country', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 200 },
  { title: '操作', key: 'actions', width: 240 },
]

const statusCounters = computed(() => {
  return entries.value.reduce(
    (acc, item) => {
      acc[item.status] += 1
      return acc
    },
    { pending: 0, approved: 0, rejected: 0 }
  )
})

const selectedEntry = ref<WaitingListEntry | null>(null)
const statusModalOpen = ref(false)
const statusUpdating = ref(false)
const statusToUpdate = ref<WaitingListStatus>('pending')

// 发送邀请码相关
const sendingEmail = ref<string | null>(null)
const sendEmailModalOpen = ref(false)
const emailSending = ref(false)
const entryToSendEmail = ref<WaitingListEntry | null>(null)

async function fetchWaitingList() {
  loading.value = true
  try {
    const { items, total: totalCount } = await waitingListService.list({
      status: statusFilter.value,
      limit: pagination.value.pageSize,
      offset: (pagination.value.current - 1) * pagination.value.pageSize,
    })
    entries.value = items
    total.value = totalCount
    lastSyncedAt.value = new Date().toISOString()
  } catch (error) {
    console.error(error)
    message.error('加载等待列表失败，请稍后重试')
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
  fetchWaitingList()
}

function handleRefresh() {
  fetchWaitingList()
}

function openStatusModal(entry: WaitingListEntry) {
  selectedEntry.value = entry
  statusToUpdate.value = entry.status
  statusModalOpen.value = true
}

async function submitStatusUpdate() {
  if (!selectedEntry.value) return
  statusUpdating.value = true
  try {
    await waitingListService.updateStatus(selectedEntry.value.emailAddress, statusToUpdate.value)
    message.success('状态更新成功')
    statusModalOpen.value = false
    await fetchWaitingList()
  } catch (error) {
    console.error(error)
    message.error('状态更新失败，请稍后重试')
  } finally {
    statusUpdating.value = false
  }
}

function openSendEmailModal(entry: WaitingListEntry) {
  entryToSendEmail.value = entry
  sendEmailModalOpen.value = true
}

async function submitSendEmail() {
  if (!entryToSendEmail.value) return
  emailSending.value = true
  sendingEmail.value = entryToSendEmail.value.emailAddress
  try {
    const result = await invitationCodeService.sendInvitationEmail({
      email: entryToSendEmail.value.emailAddress,
      fullName: entryToSendEmail.value.fullName,
    })
    message.success(`邀请码已发送至 ${entryToSendEmail.value.emailAddress}`)
    sendEmailModalOpen.value = false
    // 自动更新状态为已通过
    await waitingListService.updateStatus(entryToSendEmail.value.emailAddress, 'approved')
    await fetchWaitingList()
  } catch (error) {
    console.error(error)
    message.error('发送邀请码失败，请稍后重试')
  } finally {
    emailSending.value = false
    sendingEmail.value = null
  }
}

watch(statusFilter, () => {
  pagination.value.current = 1
  fetchWaitingList()
})

onMounted(() => {
  fetchWaitingList()
})
</script>

<template>
  <div class="waiting-list-page">
    <div class="page-header">
      <div class="title">
        <TeamOutlined />
        <div>
          <h2>等待列表</h2>
          <p>查看等待用户并管理审批状态</p>
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
        <a-card bordered class="summary-card approved">
          <div class="label">已通过</div>
          <div class="value">{{ statusCounters.approved }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card bordered class="summary-card rejected">
          <div class="label">已拒绝</div>
          <div class="value">{{ statusCounters.rejected }}</div>
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
          <template v-if="column.key === 'fullName'">
            <div class="user-cell">
              <div class="primary">{{ record.fullName }}</div>
              <div class="secondary">{{ record.emailAddress }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'organization'">
            <div class="primary">{{ record.institutionOrganization }}</div>
            <div class="secondary">{{ record.jobTitlePosition }}</div>
          </template>
          <template v-else-if="column.key === 'country'">
            {{ record.country }}
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
              <a-button type="link" @click="openStatusModal(record)">修改状态</a-button>
              <a-button
                type="link"
                :loading="sendingEmail === record.emailAddress"
                @click="openSendEmailModal(record)"
              >
                <template #icon>
                  <SendOutlined />
                </template>
                发送邀请码
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="statusModalOpen"
      title="更新等待列表状态"
      :confirm-loading="statusUpdating"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitStatusUpdate"
    >
      <div v-if="selectedEntry" class="modal-content">
        <div class="field">
          <div class="label">申请人</div>
          <div class="value">{{ selectedEntry.fullName }} · {{ selectedEntry.emailAddress }}</div>
        </div>
        <div class="field">
          <div class="label">组织 / 职位</div>
          <div class="value">
            {{ selectedEntry.institutionOrganization }} · {{ selectedEntry.jobTitlePosition }}
          </div>
        </div>
        <a-radio-group v-model:value="statusToUpdate" class="status-radio-group">
          <a-radio value="pending">待处理</a-radio>
          <a-radio value="approved">已通过</a-radio>
          <a-radio value="rejected">已拒绝</a-radio>
        </a-radio-group>
      </div>
    </a-modal>

    <!-- 发送邀请码确认弹窗 -->
    <a-modal
      v-model:open="sendEmailModalOpen"
      title="发送邀请码"
      :confirm-loading="emailSending"
      ok-text="确认发送"
      cancel-text="取消"
      @ok="submitSendEmail"
    >
      <div v-if="entryToSendEmail" class="modal-content">
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #message>
            将自动生成邀请码并发送至用户邮箱，发送后状态将自动更新为「已通过」
          </template>
        </a-alert>
        <div class="field">
          <div class="label">收件人</div>
          <div class="value">{{ entryToSendEmail.fullName }}</div>
        </div>
        <div class="field">
          <div class="label">邮箱地址</div>
          <div class="value email-value">{{ entryToSendEmail.emailAddress }}</div>
        </div>
        <div class="field">
          <div class="label">组织 / 职位</div>
          <div class="value">
            {{ entryToSendEmail.institutionOrganization }} · {{ entryToSendEmail.jobTitlePosition }}
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.waiting-list-page {
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

.summary-card.approved .value {
  color: #52c41a;
}

.summary-card.rejected .value {
  color: #f5222d;
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

.user-cell .secondary {
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

.email-value {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  color: #1890ff;
}
</style>
