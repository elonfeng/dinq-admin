<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  SearchOutlined,
  UserOutlined,
  CrownOutlined,
  DollarOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { userManagementService } from '@/services/userManagementService'
import type { AdminUserInfo, PlanInfo } from '@/types/userManagement'
import { PLAN_LABELS } from '@/types/userManagement'
import { formatDateTime } from '@/utils/formatter'

// 搜索相关
const searchEmail = ref('')
const searchDomain = ref('')
const searching = ref(false)

// 用户信息
const currentUser = ref<AdminUserInfo | null>(null)

// 套餐列表
const plans = ref<PlanInfo[]>([])

// 操作相关
const selectedPlan = ref('')
const creditAmount = ref<number>(10)
const updating = ref(false)

// 套餐选项
const planOptions = computed(() =>
  plans.value.map((p) => ({
    value: p.plan,
    label: `${PLAN_LABELS[p.plan] || p.plan} (${p.monthly_credits} credits/月)`,
    credits: p.monthly_credits,
  }))
)

// 获取套餐标签颜色
const getPlanTagColor = (plan: string) => {
  const colors: Record<string, string> = {
    free: 'default',
    basic_monthly: 'blue',
    pro_monthly: 'purple',
    plus_monthly: 'gold',
  }
  return colors[plan] || 'default'
}

// 加载套餐列表
const loadPlans = async () => {
  try {
    plans.value = await userManagementService.getPlans()
  } catch (e) {
    console.error('Failed to load plans:', e)
  }
}

// 搜索用户
const handleSearch = async (type: 'email' | 'domain') => {
  const value = type === 'email' ? searchEmail.value.trim() : searchDomain.value.trim()
  if (!value) {
    message.warning(type === 'email' ? '请输入邮箱' : '请输入域名或URL')
    return
  }

  searching.value = true
  currentUser.value = null

  try {
    const params = type === 'email' ? { email: value } : { domain: value }
    const user = await userManagementService.searchUser(params)
    if (user) {
      currentUser.value = user
      selectedPlan.value = user.plan || user.tier || 'free'
    } else {
      message.warning('未找到用户')
    }
  } catch (e: any) {
    message.error(e.response?.data?.error || '搜索失败')
  } finally {
    searching.value = false
  }
}

// 更新套餐
const handleUpdatePlan = () => {
  if (!currentUser.value || !selectedPlan.value) return

  const planInfo = plans.value.find((p) => p.plan === selectedPlan.value)
  const credits = planInfo?.monthly_credits || 0

  Modal.confirm({
    title: '确认更新套餐',
    content: `将用户套餐更新为 ${PLAN_LABELS[selectedPlan.value] || selectedPlan.value}，积分将重置为 ${credits}`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      updating.value = true
      try {
        await userManagementService.updatePlan({
          user_id: currentUser.value!.user_id,
          new_plan: selectedPlan.value,
        })
        message.success('套餐更新成功')
        // 刷新用户信息
        await handleSearch(searchEmail.value ? 'email' : 'domain')
      } catch (e: any) {
        message.error(e.response?.data?.error || '更新失败')
      } finally {
        updating.value = false
      }
    },
  })
}

// 充值积分
const handleAddCredits = () => {
  if (!currentUser.value || creditAmount.value < 1) return

  Modal.confirm({
    title: '确认充值',
    content: `将为用户充值 ${creditAmount.value} 积分`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      updating.value = true
      try {
        await userManagementService.addCredits({
          user_id: currentUser.value!.user_id,
          amount: creditAmount.value,
        })
        message.success('充值成功')
        // 刷新用户信息
        await handleSearch(searchEmail.value ? 'email' : 'domain')
      } catch (e: any) {
        message.error(e.response?.data?.error || '充值失败')
      } finally {
        updating.value = false
      }
    },
  })
}

// 清空搜索
const clearSearch = () => {
  searchEmail.value = ''
  searchDomain.value = ''
  currentUser.value = null
  selectedPlan.value = ''
}

onMounted(() => {
  loadPlans()
})
</script>

<template>
  <div class="user-management">
    <a-page-header title="用户管理" sub-title="搜索用户并管理VIP和积分">
      <template #extra>
        <a-button @click="clearSearch">
          <template #icon><ReloadOutlined /></template>
          清空
        </a-button>
      </template>
    </a-page-header>

    <!-- 搜索区域 -->
    <a-card title="搜索用户" class="search-card">
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item label="邮箱搜索">
            <a-input-search
              v-model:value="searchEmail"
              placeholder="输入用户邮箱"
              enter-button="搜索"
              :loading="searching"
              @search="handleSearch('email')"
            >
              <template #prefix><UserOutlined /></template>
            </a-input-search>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="域名/URL搜索">
            <a-input-search
              v-model:value="searchDomain"
              placeholder="输入域名或 dinq.me/xxx"
              enter-button="搜索"
              :loading="searching"
              @search="handleSearch('domain')"
            >
              <template #prefix><SearchOutlined /></template>
            </a-input-search>
          </a-form-item>
        </a-col>
      </a-row>
    </a-card>

    <!-- 用户信息卡片 -->
    <a-card v-if="currentUser" title="用户信息" class="user-card">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="用户ID">
          <a-typography-text copyable>{{ currentUser.user_id }}</a-typography-text>
        </a-descriptions-item>
        <a-descriptions-item label="域名">
          <a-tag v-if="currentUser.domain" color="blue">{{ currentUser.domain }}</a-tag>
          <span v-else class="text-muted">未设置</span>
        </a-descriptions-item>
        <a-descriptions-item label="姓名">{{ currentUser.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</a-descriptions-item>
        <a-descriptions-item label="当前套餐">
          <a-tag :color="getPlanTagColor(currentUser.plan || currentUser.tier)">
            {{ PLAN_LABELS[currentUser.plan || currentUser.tier] || currentUser.plan || currentUser.tier || 'Free' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="套餐状态">
          <a-tag :color="currentUser.plan_status === 'active' ? 'green' : 'default'">
            {{ currentUser.plan_status || '-' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="当前积分">
          <a-statistic :value="currentUser.credit_balance" :value-style="{ fontSize: '16px' }">
            <template #suffix>credits</template>
          </a-statistic>
        </a-descriptions-item>
        <a-descriptions-item label="注册时间">
          {{ currentUser.created_at ? formatDateTime(currentUser.created_at) : '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <a-divider />

      <!-- 操作区域 -->
      <a-row :gutter="24">
        <!-- 更新套餐 -->
        <a-col :span="12">
          <a-card size="small" title="更新套餐" :bordered="false">
            <template #extra>
              <CrownOutlined style="color: #faad14" />
            </template>
            <a-alert
              message="更改套餐会将积分重置为对应套餐的月度积分"
              type="warning"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-space direction="vertical" style="width: 100%">
              <a-select
                v-model:value="selectedPlan"
                :options="planOptions"
                style="width: 100%"
                placeholder="选择套餐"
              />
              <a-button
                type="primary"
                :loading="updating"
                :disabled="!selectedPlan || selectedPlan === (currentUser.plan || currentUser.tier)"
                @click="handleUpdatePlan"
                block
              >
                更新套餐
              </a-button>
            </a-space>
          </a-card>
        </a-col>

        <!-- 充值积分 -->
        <a-col :span="12">
          <a-card size="small" title="充值积分" :bordered="false">
            <template #extra>
              <DollarOutlined style="color: #52c41a" />
            </template>
            <a-alert
              message="直接增加用户积分，不影响套餐"
              type="info"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-space direction="vertical" style="width: 100%">
              <a-input-number
                v-model:value="creditAmount"
                :min="1"
                :max="10000"
                style="width: 100%"
                placeholder="输入充值数量"
              />
              <a-button
                type="primary"
                :loading="updating"
                :disabled="creditAmount < 1"
                @click="handleAddCredits"
                block
              >
                充值 {{ creditAmount }} 积分
              </a-button>
            </a-space>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 空状态 -->
    <a-card v-else class="empty-card">
      <a-empty description="请在上方搜索用户">
        <template #image>
          <UserOutlined style="font-size: 64px; color: #d9d9d9" />
        </template>
      </a-empty>
    </a-card>
  </div>
</template>

<style scoped>
.user-management {
  padding: 24px;
}

.search-card {
  margin-bottom: 24px;
}

.user-card {
  margin-bottom: 24px;
}

.empty-card {
  text-align: center;
  padding: 48px;
}

.text-muted {
  color: #999;
}
</style>
