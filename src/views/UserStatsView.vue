<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  ReloadOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BankOutlined,
  BookOutlined,
} from '@ant-design/icons-vue'
import { statsService } from '@/services/statsService'
import type { UserStats, RecentUserInfo, UserDetailInfo } from '@/types/stats'
import { TIER_LABELS } from '@/types/stats'
import { formatDateTime } from '@/utils/formatter'

// 统计数据
const stats = ref<UserStats>({
  total_users: 0,
  today_new_users: 0,
  this_week_new_users: 0,
  this_month_new_users: 0,
})
const loadingStats = ref(false)

// 用户列表
const users = ref<RecentUserInfo[]>([])
const loadingUsers = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
})

// 用户详情
const detailVisible = ref(false)
const userDetail = ref<UserDetailInfo | null>(null)
const loadingDetail = ref(false)

// 表格列定义
const columns = [
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    ellipsis: true,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '域名',
    dataIndex: 'domain',
    key: 'domain',
    width: 120,
  },
  {
    title: '套餐',
    dataIndex: 'tier',
    key: 'tier',
    width: 100,
  },
  {
    title: '积分',
    dataIndex: 'credit_balance',
    key: 'credit_balance',
    width: 80,
  },
  {
    title: '注册时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
  },
]

// 获取套餐标签颜色
const getTierTagColor = (tier: string) => {
  const colors: Record<string, string> = {
    free: 'default',
    basic_monthly: 'blue',
    pro_monthly: 'purple',
    plus_monthly: 'gold',
  }
  return colors[tier] || 'default'
}

// 加载统计数据
const loadStats = async () => {
  loadingStats.value = true
  try {
    stats.value = await statsService.getUserStats()
  } catch (e) {
    console.error('Failed to load stats:', e)
    message.error('加载统计数据失败')
  } finally {
    loadingStats.value = false
  }
}

// 加载用户列表
const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const result = await statsService.getRecentUsers(
      pagination.value.current,
      pagination.value.pageSize
    )
    users.value = result.items
    pagination.value.total = result.total
  } catch (e) {
    console.error('Failed to load users:', e)
    message.error('加载用户列表失败')
  } finally {
    loadingUsers.value = false
  }
}

// 分页变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  loadUsers()
}

// 查看用户详情
const showDetail = async (userId: string) => {
  detailVisible.value = true
  loadingDetail.value = true
  userDetail.value = null
  try {
    userDetail.value = await statsService.getUserDetail(userId)
  } catch (e) {
    console.error('Failed to load user detail:', e)
    message.error('加载用户详情失败')
  } finally {
    loadingDetail.value = false
  }
}

// 刷新数据
const refresh = () => {
  loadStats()
  loadUsers()
}

onMounted(() => {
  loadStats()
  loadUsers()
})
</script>

<template>
  <div class="user-stats">
    <a-page-header title="用户统计" sub-title="查看用户注册统计和最新注册用户">
      <template #extra>
        <a-button @click="refresh" :loading="loadingStats || loadingUsers">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card :loading="loadingStats">
          <a-statistic
            title="总用户数"
            :value="stats.total_users"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix><TeamOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :loading="loadingStats">
          <a-statistic
            title="今日新增"
            :value="stats.today_new_users"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix><UserOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :loading="loadingStats">
          <a-statistic
            title="本周新增"
            :value="stats.this_week_new_users"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix><CalendarOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :loading="loadingStats">
          <a-statistic
            title="本月新增"
            :value="stats.this_month_new_users"
            :value-style="{ color: '#fa8c16' }"
          >
            <template #prefix><CalendarOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最新注册用户列表 -->
    <a-card title="最新注册用户" class="users-card">
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loadingUsers"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        row-key="user_id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'email'">
            {{ record.email || '-' }}
          </template>
          <template v-else-if="column.key === 'name'">
            {{ record.name || '-' }}
          </template>
          <template v-else-if="column.key === 'domain'">
            <a-tag v-if="record.domain" color="blue">{{ record.domain }}</a-tag>
            <span v-else class="text-muted">-</span>
          </template>
          <template v-else-if="column.key === 'tier'">
            <a-tag :color="getTierTagColor(record.tier)">
              {{ TIER_LABELS[record.tier] || record.tier || 'Free' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'credit_balance'">
            {{ record.credit_balance }}
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ record.created_at ? formatDateTime(record.created_at) : '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="showDetail(record.user_id)">
              详情
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 用户详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="用户详情"
      :width="500"
      placement="right"
    >
      <a-spin :spinning="loadingDetail">
        <template v-if="userDetail">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="用户ID">
              <a-typography-text copyable>{{ userDetail.user_id }}</a-typography-text>
            </a-descriptions-item>
            <a-descriptions-item label="邮箱">
              <MailOutlined style="margin-right: 8px" />
              {{ userDetail.email || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="姓名">
              <UserOutlined style="margin-right: 8px" />
              {{ userDetail.name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="域名">
              <a-tag v-if="userDetail.domain" color="blue">{{ userDetail.domain }}</a-tag>
              <span v-else class="text-muted">未设置</span>
            </a-descriptions-item>
            <a-descriptions-item label="套餐">
              <a-tag :color="getTierTagColor(userDetail.tier)">
                {{ TIER_LABELS[userDetail.tier] || userDetail.tier || 'Free' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="套餐状态">
              <a-tag :color="userDetail.plan_status === 'active' ? 'green' : 'default'">
                {{ userDetail.plan_status || '-' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="积分余额">
              <a-statistic :value="userDetail.credit_balance" :value-style="{ fontSize: '14px' }">
                <template #suffix>credits</template>
              </a-statistic>
            </a-descriptions-item>
            <a-descriptions-item label="职位">
              <BankOutlined style="margin-right: 8px" />
              {{ userDetail.position || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="公司">
              <BankOutlined style="margin-right: 8px" />
              {{ userDetail.company || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="学校">
              <BookOutlined style="margin-right: 8px" />
              {{ userDetail.school || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="位置">
              <EnvironmentOutlined style="margin-right: 8px" />
              {{ userDetail.location || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="注册时间">
              <CalendarOutlined style="margin-right: 8px" />
              {{ userDetail.created_at ? formatDateTime(userDetail.created_at) : '-' }}
            </a-descriptions-item>
          </a-descriptions>

          <div v-if="userDetail.avatar_url" style="margin-top: 16px; text-align: center">
            <a-avatar :src="userDetail.avatar_url" :size="80" />
          </div>
        </template>
        <a-empty v-else-if="!loadingDetail" description="暂无数据" />
      </a-spin>
    </a-drawer>
  </div>
</template>

<style scoped>
.user-stats {
  padding: 24px;
}

.stats-row {
  margin-bottom: 24px;
}

.users-card {
  margin-bottom: 24px;
}

.text-muted {
  color: #999;
}
</style>
