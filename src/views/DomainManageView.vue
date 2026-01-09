<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import { domainService } from '@/services/domainService'
import type { ReservedDomain } from '@/services/domainService'

// 列表数据
const domains = ref<ReservedDomain[]>([])
const loading = ref(false)

// 添加弹窗
const addVisible = ref(false)
const addForm = ref({
  domain: '',
  reason: '系统保留',
})
const addLoading = ref(false)

// 批量添加弹窗
const batchVisible = ref(false)
const batchForm = ref({
  domains: '',
  reason: '系统保留',
})
const batchLoading = ref(false)

// 预设原因选项
const reasonOptions = ['系统保留', '品牌保护', '敏感词']

// 按原因分组
const groupedDomains = computed(() => {
  const groups: Record<string, ReservedDomain[]> = {}
  for (const d of domains.value) {
    const reason = d.reason || '未分类'
    if (!groups[reason]) {
      groups[reason] = []
    }
    groups[reason].push(d)
  }
  // 排序：系统保留 > 品牌保护 > 敏感词 > 其他
  const order = ['系统保留', '品牌保护', '敏感词']
  const sorted: [string, ReservedDomain[]][] = []
  for (const key of order) {
    if (groups[key]) {
      sorted.push([key, groups[key]])
      delete groups[key]
    }
  }
  // 剩余的按字母顺序
  for (const key of Object.keys(groups).sort()) {
    sorted.push([key, groups[key]])
  }
  return sorted
})

// 统计
const totalCount = computed(() => domains.value.length)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const result = await domainService.getList(1, 1000, '')
    domains.value = result.items
  } catch (e) {
    console.error('Failed to load domains:', e)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 添加域名
const handleAdd = async () => {
  if (!addForm.value.domain.trim()) {
    message.warning('请输入域名')
    return
  }

  addLoading.value = true
  try {
    await domainService.add(addForm.value.domain.trim(), addForm.value.reason)
    message.success('添加成功')
    addVisible.value = false
    addForm.value = { domain: '', reason: '系统保留' }
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
    const result = await domainService.batchAdd(domainList, batchForm.value.reason)
    message.success(`成功添加 ${result.added} 个，跳过 ${result.skipped} 个已存在`)
    batchVisible.value = false
    batchForm.value = { domains: '', reason: '系统保留' }
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
    content: `确定要删除 "${record.domain}" 吗？`,
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

// 获取分类颜色
const getReasonColor = (reason: string) => {
  const colors: Record<string, string> = {
    '系统保留': 'default',
    '品牌保护': 'blue',
    '敏感词': 'red',
  }
  return colors[reason] || 'default'
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="domain-manage">
    <a-page-header title="域名管理" :sub-title="`共 ${totalCount} 个保留域名`">
      <template #extra>
        <a-space>
          <a-button @click="loadData" :loading="loading">
            <template #icon><ReloadOutlined /></template>
          </a-button>
          <a-button @click="batchVisible = true">批量添加</a-button>
          <a-button type="primary" @click="addVisible = true">
            <template #icon><PlusOutlined /></template>
            添加
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <div class="domain-groups">
        <a-card
          v-for="[reason, items] in groupedDomains"
          :key="reason"
          :title="`${reason} (${items.length})`"
          size="small"
          class="group-card"
        >
          <div class="domain-tags">
            <a-tag
              v-for="item in items"
              :key="item.id"
              :color="getReasonColor(reason)"
              closable
              @close.prevent="handleDelete(item)"
            >
              {{ item.domain }}
            </a-tag>
          </div>
        </a-card>
      </div>
    </a-spin>

    <!-- 添加弹窗 -->
    <a-modal
      v-model:open="addVisible"
      title="添加保留域名"
      @ok="handleAdd"
      :confirm-loading="addLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="域名" required>
          <a-input v-model:value="addForm.domain" placeholder="输入域名" />
        </a-form-item>
        <a-form-item label="分类">
          <a-radio-group v-model:value="addForm.reason">
            <a-radio v-for="r in reasonOptions" :key="r" :value="r">{{ r }}</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量添加弹窗 -->
    <a-modal
      v-model:open="batchVisible"
      title="批量添加"
      @ok="handleBatchAdd"
      :confirm-loading="batchLoading"
      width="500px"
    >
      <a-form layout="vertical">
        <a-form-item label="域名列表" required>
          <a-textarea
            v-model:value="batchForm.domains"
            placeholder="每行一个，或用逗号分隔"
            :rows="6"
          />
        </a-form-item>
        <a-form-item label="分类">
          <a-radio-group v-model:value="batchForm.reason">
            <a-radio v-for="r in reasonOptions" :key="r" :value="r">{{ r }}</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.domain-manage {
  padding: 24px;
}

.domain-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-card {
  margin-bottom: 0;
}

.domain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.domain-tags .ant-tag {
  margin: 0;
  font-family: monospace;
}
</style>
