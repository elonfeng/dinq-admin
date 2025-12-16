<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  ReloadOutlined,
  GiftOutlined,
  CopyOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'
import { invitationCodeService } from '@/services/invitationCodeService'
import type {
  InvitationCodeWithUsage,
  InvitationCodeType,
  InvitationCodeStatus,
  BatchGenerateRequest,
  InviteCodeUser,
} from '@/types/invitationCode'
import { formatDateTime, formatRelativeTime } from '@/utils/formatter'

const loading = ref(false)
const codes = ref<InvitationCodeWithUsage[]>([])
const total = ref(0)
const lastSyncedAt = ref<string | null>(null)

const pagination = ref({
  current: 1,
  pageSize: 20,
})

const searchCode = ref('')
const sourceFilter = ref('')
const typeFilter = ref<InvitationCodeType | ''>('')
const notesFilter = ref('')

const typeTagMap: Record<InvitationCodeType, { color: string; label: string }> = {
  single: { color: 'blue', label: '单次使用' },
  multi: { color: 'purple', label: '多次使用' },
}

const statusTagMap: Record<InvitationCodeStatus, { color: string; label: string }> = {
  active: { color: 'green', label: '生效中' },
  disabled: { color: 'default', label: '已禁用' },
}

const columns = [
  { title: '邀请码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '使用次数', dataIndex: 'usedCount', key: 'usedCount', width: 100 },
  { title: '备注', dataIndex: 'notes', key: 'notes', width: 160, ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '过期时间', dataIndex: 'expiresAt', key: 'expiresAt', width: 140 },
  { title: '操作', key: 'actions', width: 260 },
]

const getDisplayStatus = (code: InvitationCodeWithUsage) => {
  if (code.status === 'disabled') {
    return { color: 'default', label: '已禁用' }
  }
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    return { color: 'orange', label: '已过期' }
  }
  if (code.type === 'single' && code.isUsed) {
    return { color: 'cyan', label: '已使用' }
  }
  return { color: 'green', label: '生效中' }
}

const statusCounters = computed(() => {
  return codes.value.reduce(
    (acc, item) => {
      if (item.status === 'disabled') {
        acc.disabled += 1
      } else if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
        acc.expired += 1
      } else {
        acc.active += 1
      }
      return acc
    },
    { active: 0, disabled: 0, expired: 0 }
  )
})

// 有效期选项
const expiresOptions = [
  { value: 30, label: '30 天' },
  { value: 90, label: '90 天' },
  { value: 180, label: '180 天' },
  { value: 0, label: '永不过期' },
]

// 批量生成弹窗
const generateModalOpen = ref(false)
const generating = ref(false)
const generateForm = ref<BatchGenerateRequest>({
  count: 1,
  code: '',
  source: '',
  type: 'single',
  expiresInDay: 30,
  notes: '',
})

// 生成结果弹窗
const resultModalOpen = ref(false)
const generatedCodes = ref<string[]>([])

// 查看用户弹窗
const usersModalOpen = ref(false)
const usersLoading = ref(false)
const selectedCode = ref('')
const codeUsers = ref<InviteCodeUser[]>([])
const codeUsersCount = ref(0)

// 状态更新 loading
const statusUpdating = ref<string | null>(null)

// 删除相关
const deleteConfirmOpen = ref(false)
const deleting = ref(false)
const codeToDelete = ref<string | null>(null)

// 编辑备注相关
const editNotesModalOpen = ref(false)
const editingNotes = ref(false)
const editNotesForm = ref({ code: '', notes: '' })

async function fetchCodes() {
  loading.value = true
  try {
    const result = await invitationCodeService.list({
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      source: sourceFilter.value || undefined,
      type: typeFilter.value || undefined,
      notes: notesFilter.value || undefined,
    })
    codes.value = result.codes
    total.value = result.total
    lastSyncedAt.value = new Date().toISOString()

    // 为每个邀请码获取使用次数
    await Promise.all(
      codes.value.map(async (code) => {
        try {
          const stats = await invitationCodeService.getCodeStats(code.code)
          code.usedCount = stats.usedCount
        } catch {
          // 忽略错误
        }
      })
    )
  } catch (error) {
    console.error(error)
    message.error('加载邀请码列表失败')
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
  fetchCodes()
}

function handleRefresh() {
  fetchCodes()
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    message.success('邀请码已复制')
  } catch {
    message.error('复制失败')
  }
}

async function copyAllGeneratedCodes() {
  try {
    await navigator.clipboard.writeText(generatedCodes.value.join('\n'))
    message.success('所有邀请码已复制')
  } catch {
    message.error('复制失败')
  }
}

function openGenerateModal() {
  generateForm.value = {
    count: 1,
    code: '',
    source: '',
    type: 'single',
    expiresInDay: 30,
    notes: '',
  }
  generateModalOpen.value = true
}

async function submitGenerate() {
  if (generateForm.value.count <= 0 || generateForm.value.count > 1000) {
    message.error('数量必须在 1-1000 之间')
    return
  }

  generating.value = true
  try {
    const result = await invitationCodeService.batchGenerate(generateForm.value)
    message.success(result.message || `成功生成 ${result.count} 个邀请码`)
    generatedCodes.value = result.codes
    generateModalOpen.value = false
    resultModalOpen.value = true
    await fetchCodes()
  } catch (error) {
    console.error(error)
    message.error('生成邀请码失败')
  } finally {
    generating.value = false
  }
}

async function handleSearch() {
  if (!searchCode.value.trim()) {
    fetchCodes()
    return
  }
  loading.value = true
  try {
    const result = await invitationCodeService.getByCode(searchCode.value.trim())
    if (result) {
      // 获取使用次数
      try {
        const stats = await invitationCodeService.getCodeStats(result.code)
        result.usedCount = stats.usedCount
      } catch {
        // 忽略
      }
      codes.value = [result]
      total.value = 1
    } else {
      codes.value = []
      total.value = 0
      message.warning('未找到该邀请码')
    }
  } catch {
    codes.value = []
    total.value = 0
    message.warning('未找到该邀请码')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(code: InvitationCodeWithUsage) {
  const newStatus: InvitationCodeStatus = code.status === 'active' ? 'disabled' : 'active'
  statusUpdating.value = code.code
  try {
    await invitationCodeService.updateStatus(code.code, newStatus)
    message.success(newStatus === 'active' ? '邀请码已启用' : '邀请码已禁用')
    code.status = newStatus
  } catch (error) {
    console.error(error)
    message.error('更新状态失败')
  } finally {
    statusUpdating.value = null
  }
}

async function openUsersModal(code: string) {
  selectedCode.value = code
  usersModalOpen.value = true
  usersLoading.value = true
  codeUsers.value = []
  codeUsersCount.value = 0

  try {
    const result = await invitationCodeService.getCodeUsers(code)
    codeUsers.value = result.users
    codeUsersCount.value = result.count
  } catch (error) {
    console.error(error)
    message.error('获取用户列表失败')
  } finally {
    usersLoading.value = false
  }
}

function openDeleteConfirm(code: string) {
  codeToDelete.value = code
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  if (!codeToDelete.value) return

  deleting.value = true
  try {
    await invitationCodeService.delete(codeToDelete.value)
    message.success('邀请码已删除')
    deleteConfirmOpen.value = false
    codeToDelete.value = null
    await fetchCodes()
  } catch (error) {
    console.error(error)
    message.error('删除失败')
  } finally {
    deleting.value = false
  }
}

function openEditNotesModal(record: InvitationCodeWithUsage) {
  editNotesForm.value = {
    code: record.code,
    notes: record.notes || '',
  }
  editNotesModalOpen.value = true
}

async function submitEditNotes() {
  editingNotes.value = true
  try {
    await invitationCodeService.updateNotes(editNotesForm.value.code, editNotesForm.value.notes)
    message.success('备注已更新')
    editNotesModalOpen.value = false
    // 更新本地数据
    const target = codes.value.find((c) => c.code === editNotesForm.value.code)
    if (target) {
      target.notes = editNotesForm.value.notes
    }
  } catch (error) {
    console.error(error)
    message.error('更新备注失败')
  } finally {
    editingNotes.value = false
  }
}

watch([sourceFilter, typeFilter, notesFilter], () => {
  pagination.value.current = 1
  fetchCodes()
})

onMounted(() => {
  fetchCodes()
})
</script>

<template>
  <div class="invitation-code-page">
    <div class="page-header">
      <div class="title">
        <GiftOutlined />
        <div>
          <h2>邀请码管理</h2>
          <p>查看、搜索、生成和管理邀请码</p>
        </div>
      </div>
      <div class="actions">
        <span v-if="lastSyncedAt" class="last-updated">
          最近刷新：{{ formatRelativeTime(lastSyncedAt) }}
        </span>
        <a-button type="primary" @click="openGenerateModal">
          <template #icon>
            <PlusOutlined />
          </template>
          批量生成
        </a-button>
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
        <a-card bordered class="summary-card active">
          <div class="label">生效中</div>
          <div class="value">{{ statusCounters.active }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card bordered class="summary-card disabled">
          <div class="label">已禁用</div>
          <div class="value">{{ statusCounters.disabled }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card bordered class="summary-card expired">
          <div class="label">已过期</div>
          <div class="value">{{ statusCounters.expired }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="table-card" :loading="loading">
      <div class="table-toolbar">
        <a-space>
          <a-input-search
            v-model:value="searchCode"
            placeholder="搜索邀请码"
            style="width: 200px"
            allow-clear
            @search="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input-search>
          <a-select
            v-model:value="typeFilter"
            placeholder="类型"
            style="width: 120px"
            allow-clear
          >
            <a-select-option value="single">单次</a-select-option>
            <a-select-option value="multi">重复</a-select-option>
          </a-select>
          <a-input
            v-model:value="sourceFilter"
            placeholder="来源"
            style="width: 120px"
            allow-clear
          />
          <a-input
            v-model:value="notesFilter"
            placeholder="备注"
            style="width: 140px"
            allow-clear
          />
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="codes"
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
          <template v-if="column.key === 'code'">
            <div class="code-cell">
              <code class="invite-code">{{ record.code }}</code>
              <a-button type="link" size="small" @click="copyCode(record.code)">
                <template #icon>
                  <CopyOutlined />
                </template>
              </a-button>
            </div>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="typeTagMap[record.type as InvitationCodeType]?.color || 'default'">
              {{ typeTagMap[record.type as InvitationCodeType]?.label || record.type }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'source'">
            {{ record.source }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getDisplayStatus(record).color">
              {{ getDisplayStatus(record).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'usedCount'">
            <a-button
              type="link"
              size="small"
              :disabled="record.usedCount === 0"
              @click="openUsersModal(record.code)"
            >
              <UserOutlined />
              {{ record.usedCount || 0 }} 人
            </a-button>
          </template>
          <template v-else-if="column.key === 'notes'">
            <span v-if="record.notes" class="notes-cell" :title="record.notes">
              {{ record.notes }}
            </span>
            <span v-else class="no-notes">-</span>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            <div class="time-cell">
              <div class="primary">{{ formatDateTime(record.createdAt) }}</div>
              <div class="secondary">{{ formatRelativeTime(record.createdAt) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'expiresAt'">
            <template v-if="record.expiresAt">
              <div class="time-cell">
                <div class="primary">{{ formatDateTime(record.expiresAt) }}</div>
              </div>
            </template>
            <span v-else class="no-expire">永不过期</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="copyCode(record.code)">
                复制
              </a-button>
              <a-button type="link" size="small" @click="openEditNotesModal(record)">
                <template #icon>
                  <EditOutlined />
                </template>
                备注
              </a-button>
              <a-button
                type="link"
                size="small"
                :loading="statusUpdating === record.code"
                :danger="record.status === 'active'"
                @click="toggleStatus(record)"
              >
                <template #icon>
                  <StopOutlined v-if="record.status === 'active'" />
                  <CheckCircleOutlined v-else />
                </template>
                {{ record.status === 'active' ? '禁用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" danger @click="openDeleteConfirm(record.code)">
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

    <!-- 批量生成弹窗 -->
    <a-modal
      v-model:open="generateModalOpen"
      title="批量生成邀请码"
      :confirm-loading="generating"
      ok-text="生成"
      cancel-text="取消"
      @ok="submitGenerate"
    >
      <a-form layout="vertical">
        <a-form-item label="生成数量" required>
          <a-input-number
            v-model:value="generateForm.count"
            :min="1"
            :max="1000"
            style="width: 100%"
          />
          <div class="form-hint">最多一次生成 1000 个</div>
        </a-form-item>
        <a-form-item v-if="generateForm.count === 1" label="自定义邀请码">
          <a-input
            v-model:value="generateForm.code"
            placeholder="留空则自动生成"
            style="text-transform: uppercase"
          />
          <div class="form-hint">可选，自定义邀请码会自动转为大写</div>
        </a-form-item>
        <a-form-item label="来源标识">
          <a-input v-model:value="generateForm.source" placeholder="如：kol_xxx、waitinglist（可选）" />
          <div class="form-hint">用于标识邀请码来源，如 KOL 名称</div>
        </a-form-item>
        <a-form-item label="类型">
          <a-radio-group v-model:value="generateForm.type">
            <a-radio value="single">单次（默认）</a-radio>
            <a-radio value="multi">重复</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="有效期">
          <a-select v-model:value="generateForm.expiresInDay" style="width: 100%">
            <a-select-option
              v-for="opt in expiresOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="generateForm.notes" :rows="2" placeholder="可选备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 生成结果弹窗 -->
    <a-modal
      v-model:open="resultModalOpen"
      title="生成成功"
      :footer="null"
      width="600px"
    >
      <div class="result-content">
        <div class="result-header">
          <span>共生成 {{ generatedCodes.length }} 个邀请码</span>
          <a-button type="primary" size="small" @click="copyAllGeneratedCodes">
            <template #icon>
              <CopyOutlined />
            </template>
            全部复制
          </a-button>
        </div>
        <div class="codes-list">
          <div
            v-for="code in generatedCodes"
            :key="code"
            class="code-item"
            @click="copyCode(code)"
          >
            <code>{{ code }}</code>
            <CopyOutlined class="copy-icon" />
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 查看使用者弹窗 -->
    <a-modal
      v-model:open="usersModalOpen"
      :title="`使用邀请码 ${selectedCode} 的用户`"
      :footer="null"
      width="600px"
    >
      <a-spin :spinning="usersLoading">
        <div v-if="codeUsers.length === 0 && !usersLoading" class="empty-users">
          暂无用户使用此邀请码
        </div>
        <div v-else class="users-list">
          <div class="users-header">
            共 {{ codeUsersCount }} 位用户
          </div>
          <a-table
            :data-source="codeUsers"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <a-table-column title="用户名" data-index="name" key="name" />
            <a-table-column title="邮箱" data-index="email" key="email" />
            <a-table-column title="注册时间" data-index="createdAt" key="createdAt">
              <template #default="{ record }">
                {{ formatDateTime(record.createdAt) }}
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-spin>
    </a-modal>

    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:open="deleteConfirmOpen"
      title="删除邀请码"
      :confirm-loading="deleting"
      ok-text="删除"
      ok-type="danger"
      cancel-text="取消"
      @ok="confirmDelete"
    >
      <p>确定要删除邀请码 <code>{{ codeToDelete }}</code> 吗？</p>
      <p class="delete-warning">此操作不可恢复！</p>
    </a-modal>

    <!-- 编辑备注弹窗 -->
    <a-modal
      v-model:open="editNotesModalOpen"
      title="编辑备注"
      :confirm-loading="editingNotes"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitEditNotes"
    >
      <a-form layout="vertical">
        <a-form-item label="邀请码">
          <code class="invite-code">{{ editNotesForm.code }}</code>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="editNotesForm.notes"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.invitation-code-page {
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

.summary-card.active .value {
  color: #52c41a;
}

.summary-card.disabled .value {
  color: #8c8c8c;
}

.summary-card.expired .value {
  color: #faad14;
}

.table-card {
  margin-top: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.code-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.invite-code {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.time-cell .primary {
  font-weight: 500;
}

.time-cell .secondary {
  color: #8c8c8c;
  font-size: 12px;
}

.no-expire {
  color: #8c8c8c;
}

.notes-cell {
  color: #595959;
  font-size: 13px;
}

.no-notes {
  color: #bfbfbf;
}

.delete-warning {
  color: #ff4d4f;
  font-size: 13px;
  margin-top: 8px;
}

.form-hint {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.result-content {
  max-height: 400px;
  overflow-y: auto;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.codes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.code-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.code-item:hover {
  background: #e6f4ff;
}

.code-item code {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
}

.code-item .copy-icon {
  color: #8c8c8c;
  font-size: 12px;
}

.empty-users {
  text-align: center;
  color: #8c8c8c;
  padding: 40px 0;
}

.users-list .users-header {
  margin-bottom: 12px;
  color: #8c8c8c;
}
</style>
