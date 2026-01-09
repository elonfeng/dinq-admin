<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue'
import { domainService } from '@/services/domainService'
import type { ReservedDomain } from '@/services/domainService'
import { formatDateTime } from '@/utils/formatter'

// 列表数据
const domains = ref<ReservedDomain[]>([])
const loading = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
})
const keyword = ref('')

// 添加弹窗
const addVisible = ref(false)
const addForm = ref({
  domain: '',
  reason: '',
})
const addLoading = ref(false)

// 批量添加弹窗
const batchVisible = ref(false)
const batchForm = ref({
  domains: '',
  reason: '',
})
const batchLoading = ref(false)

// 默认域名弹窗
const defaultsVisible = ref(false)
const defaultDomains = ref<string[]>([])

// 表格列
const columns = [
  {
    title: '域名',
    dataIndex: 'domain',
    key: 'domain',
    width: 200,
  },
  {
    title: '保留原因',
    dataIndex: 'reason',
    key: 'reason',
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right' as const,
  },
]

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const result = await domainService.getList(
      pagination.value.current,
      pagination.value.pageSize,
      keyword.value
    )
    domains.value = result.items
    pagination.value.total = result.total
  } catch (e) {
    console.error('Failed to load domains:', e)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.current = 1
  loadData()
}

// 分页变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  loadData()
}

// 添加域名
const handleAdd = async () => {
  if (!addForm.value.domain.trim()) {
    message.warning('请输入域名')
    return
  }

  addLoading.value = true
  try {
    await domainService.add(addForm.value.domain.trim(), addForm.value.reason.trim())
    message.success('添加成功')
    addVisible.value = false
    addForm.value = { domain: '', reason: '' }
    loadData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '添加失败')
  } finally {
    addLoading.value = false
  }
}

// 批量添加
const handleBatchAdd = async () => {
  const domainsText = batchForm.value.domains.trim()
  if (!domainsText) {
    message.warning('请输入域名')
    return
  }

  // 按换行或逗号分隔
  const domainList = domainsText
    .split(/[\n,]/)
    .map(d => d.trim())
    .filter(d => d)

  if (domainList.length === 0) {
    message.warning('请输入至少一个域名')
    return
  }

  batchLoading.value = true
  try {
    const result = await domainService.batchAdd(domainList, batchForm.value.reason.trim())
    message.success(`成功添加 ${result.added} 个，跳过 ${result.skipped} 个已存在的域名`)
    batchVisible.value = false
    batchForm.value = { domains: '', reason: '' }
    loadData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '批量添加失败')
  } finally {
    batchLoading.value = false
  }
}

// 删除域名
const handleDelete = (record: ReservedDomain) => {
  Modal.confirm({
    title: '确认删除',
    icon: ExclamationCircleOutlined,
    content: `确定要删除保留域名 "${record.domain}" 吗？删除后该域名可被用户申请。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await domainService.delete(record.id)
        message.success('删除成功')
        loadData()
      } catch (e: any) {
        message.error(e.response?.data?.error || '删除失败')
      }
    },
  })
}

// 查看默认域名
const showDefaults = async () => {
  try {
    defaultDomains.value = await domainService.getDefaults()
    defaultsVisible.value = true
  } catch (e) {
    message.error('获取默认域名列表失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="domain-manage">
    <a-page-header title="域名管理" sub-title="管理保留域名，防止用户申请敏感域名">
      <template #extra>
        <a-space>
          <a-button @click="showDefaults">
            查看默认禁用
          </a-button>
          <a-button @click="batchVisible = true">
            批量添加
          </a-button>
          <a-button type="primary" @click="addVisible = true">
            <template #icon><PlusOutlined /></template>
            添加域名
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 搜索栏 -->
    <a-card class="search-card">
      <a-space>
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索域名或原因"
          style="width: 300px"
          @search="handleSearch"
          allow-clear
        >
          <template #prefix><SearchOutlined /></template>
        </a-input-search>
        <a-button @click="loadData" :loading="loading">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </a-space>
    </a-card>

    <!-- 数据表格 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="domains"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'domain'">
            <a-typography-text code>{{ record.domain }}</a-typography-text>
          </template>
          <template v-else-if="column.key === 'reason'">
            {{ record.reason || '-' }}
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ record.created_at ? formatDateTime(record.created_at) : '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" danger size="small" @click="handleDelete(record)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加弹窗 -->
    <a-modal
      v-model:open="addVisible"
      title="添加保留域名"
      @ok="handleAdd"
      :confirm-loading="addLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="域名" required>
          <a-input
            v-model:value="addForm.domain"
            placeholder="输入要保留的域名"
          />
        </a-form-item>
        <a-form-item label="保留原因">
          <a-input
            v-model:value="addForm.reason"
            placeholder="可选，如：品牌保护、系统保留等"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量添加弹窗 -->
    <a-modal
      v-model:open="batchVisible"
      title="批量添加保留域名"
      @ok="handleBatchAdd"
      :confirm-loading="batchLoading"
      width="500px"
    >
      <a-form layout="vertical">
        <a-form-item label="域名列表" required>
          <a-textarea
            v-model:value="batchForm.domains"
            placeholder="每行一个域名，或用逗号分隔"
            :rows="8"
          />
        </a-form-item>
        <a-form-item label="保留原因">
          <a-input
            v-model:value="batchForm.reason"
            placeholder="可选，统一的保留原因"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 默认域名弹窗 -->
    <a-modal
      v-model:open="defaultsVisible"
      title="默认禁用域名列表"
      :footer="null"
      width="600px"
    >
      <a-alert
        type="info"
        message="以下域名为系统内置禁用，无法通过管理后台修改"
        style="margin-bottom: 16px"
      />
      <div class="default-domains">
        <a-tag v-for="d in defaultDomains" :key="d" color="default">
          {{ d }}
        </a-tag>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.domain-manage {
  padding: 24px;
}

.search-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 24px;
}

.default-domains {
  max-height: 400px;
  overflow-y: auto;
}

.default-domains .ant-tag {
  margin: 4px;
}
</style>
