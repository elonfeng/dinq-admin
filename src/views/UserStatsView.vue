<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  ReloadOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  FormOutlined,
  GlobalOutlined,
  FileTextOutlined,
  GoogleOutlined,
  GithubOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { statsService } from '@/services/statsService'
import type { UserStats, RecentUserInfo, UserDetailInfo } from '@/types/stats'
import { TIER_LABELS, FLOW_STATUS_LABELS, AUTH_PROVIDER_LABELS } from '@/types/stats'
import { formatDateTime } from '@/utils/formatter'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

// 统计数据
const stats = ref<UserStats>({
  total_users: 0,
  today_new_users: 0,
  this_week_new_users: 0,
  this_month_new_users: 0,
  init_users: 0,
  domain_users: 0,
  resume_users: 0,
  success_users: 0,
  deleted_users: 0,
  email_users: 0,
  google_users: 0,
  github_users: 0,
  top_invite_codes: [],
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

// 注册状态饼图配置
const flowStatusChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
  },
  series: [
    {
      name: '注册状态',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      data: [
        { value: stats.value.init_users, name: '仅注册', itemStyle: { color: '#8c8c8c' } },
        { value: stats.value.domain_users, name: '已申请域名', itemStyle: { color: '#1890ff' } },
        { value: stats.value.resume_users, name: '分析简历', itemStyle: { color: '#fa8c16' } },
        { value: stats.value.success_users, name: '生成成功', itemStyle: { color: '#52c41a' } },
        { value: stats.value.deleted_users, name: '已注销', itemStyle: { color: '#ff4d4f' } },
      ].filter(item => item.value > 0),
    },
  ],
}))

// 登录方式饼图配置
const authProviderChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
  },
  series: [
    {
      name: '登录方式',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      data: [
        { value: stats.value.email_users, name: '邮箱', itemStyle: { color: '#8c8c8c' } },
        { value: stats.value.google_users, name: 'Google', itemStyle: { color: '#f5222d' } },
        { value: stats.value.github_users, name: 'GitHub', itemStyle: { color: '#722ed1' } },
      ].filter(item => item.value > 0),
    },
  ],
}))

// 用户增长柱状图配置
const userGrowthChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['今日', '本周', '本月'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '新增用户',
      type: 'bar',
      data: [
        { value: stats.value.today_new_users, itemStyle: { color: '#52c41a' } },
        { value: stats.value.this_week_new_users, itemStyle: { color: '#722ed1' } },
        { value: stats.value.this_month_new_users, itemStyle: { color: '#fa8c16' } },
      ],
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
      },
    },
  ],
}))

// 邀请码使用统计柱状图配置
const inviteCodeChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: stats.value.top_invite_codes.map(item => item.invite_code),
    axisLabel: {
      interval: 0,
      rotate: 30,
      fontSize: 10,
    },
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '使用人数',
      type: 'bar',
      data: stats.value.top_invite_codes.map(item => ({
        value: item.user_count,
        itemStyle: { color: '#1890ff' },
      })),
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
      },
    },
  ],
}))

// 表格列定义
const columns = [
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200,
    ellipsis: true,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100,
    ellipsis: true,
  },
  {
    title: '域名',
    dataIndex: 'domain',
    key: 'domain',
    width: 100,
  },
  {
    title: '套餐',
    dataIndex: 'tier',
    key: 'tier',
    width: 80,
  },
  {
    title: '状态',
    dataIndex: 'flow_status',
    key: 'flow_status',
    width: 90,
  },
  {
    title: '登录',
    dataIndex: 'auth_provider',
    key: 'auth_provider',
    width: 80,
  },
  {
    title: '积分',
    dataIndex: 'credit_balance',
    key: 'credit_balance',
    width: 60,
  },
  {
    title: '注册时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    width: 60,
    fixed: 'right' as const,
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

// 获取注册状态标签颜色
const getFlowStatusTagColor = (status: string) => {
  const colors: Record<string, string> = {
    init: 'default',
    domain: 'blue',
    resume: 'orange',
    success: 'green',
    deleted: 'red',
  }
  return colors[status] || 'default'
}

// 获取登录方式标签颜色
const getAuthProviderTagColor = (provider: string) => {
  const colors: Record<string, string> = {
    email: 'default',
    google: 'red',
    github: 'purple',
  }
  return colors[provider] || 'default'
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

    <!-- 总用户数卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card :loading="loadingStats">
          <a-statistic
            title="总用户数"
            :value="stats.total_users"
            :value-style="{ color: '#1890ff', fontSize: '32px' }"
          >
            <template #prefix><TeamOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="18">
        <a-card :loading="loadingStats" title="用户增长趋势">
          <v-chart :option="userGrowthChartOption" style="height: 120px" autoresize />
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="12">
        <a-card :loading="loadingStats" title="注册状态分布">
          <v-chart :option="flowStatusChartOption" style="height: 280px" autoresize />
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card :loading="loadingStats" title="登录方式分布">
          <v-chart :option="authProviderChartOption" style="height: 280px" autoresize />
        </a-card>
      </a-col>
    </a-row>

    <!-- 邀请码统计 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="24">
        <a-card :loading="loadingStats" title="邀请码使用统计（Top 10）">
          <template v-if="stats.top_invite_codes.length > 0">
            <v-chart :option="inviteCodeChartOption" style="height: 280px" autoresize />
          </template>
          <a-empty v-else description="暂无邀请码使用数据" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 详细数据卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="12">
        <a-card :loading="loadingStats" title="注册状态明细" size="small">
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-statistic title="仅注册" :value="stats.init_users" :value-style="{ color: '#8c8c8c' }">
                <template #prefix><FormOutlined /></template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic title="已申请域名" :value="stats.domain_users" :value-style="{ color: '#1890ff' }">
                <template #prefix><GlobalOutlined /></template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic title="分析简历" :value="stats.resume_users" :value-style="{ color: '#fa8c16' }">
                <template #prefix><FileTextOutlined /></template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic title="生成成功" :value="stats.success_users" :value-style="{ color: '#52c41a' }">
                <template #prefix><CheckCircleOutlined /></template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic title="已注销" :value="stats.deleted_users" :value-style="{ color: '#ff4d4f' }">
                <template #prefix><DeleteOutlined /></template>
              </a-statistic>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card :loading="loadingStats" title="登录方式明细" size="small">
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-statistic title="邮箱注册" :value="stats.email_users" :value-style="{ color: '#8c8c8c' }">
                <template #prefix><MailOutlined /></template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic title="Google 登录" :value="stats.google_users" :value-style="{ color: '#f5222d' }">
                <template #prefix><GoogleOutlined /></template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic title="GitHub 登录" :value="stats.github_users" :value-style="{ color: '#722ed1' }">
                <template #prefix><GithubOutlined /></template>
              </a-statistic>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最新注册用户列表 -->
    <a-card title="最新注册用户" class="users-card">
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loadingUsers"
        :scroll="{ x: 950 }"
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
          <template v-else-if="column.key === 'flow_status'">
            <a-tag :color="getFlowStatusTagColor(record.flow_status)">
              {{ FLOW_STATUS_LABELS[record.flow_status] || record.flow_status || '-' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'auth_provider'">
            <a-tag :color="getAuthProviderTagColor(record.auth_provider)">
              {{ AUTH_PROVIDER_LABELS[record.auth_provider] || record.auth_provider || '-' }}
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
            <a-descriptions-item label="注册状态">
              <a-tag :color="getFlowStatusTagColor(userDetail.flow_status)">
                {{ FLOW_STATUS_LABELS[userDetail.flow_status] || userDetail.flow_status || '-' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="登录方式">
              <a-tag :color="getAuthProviderTagColor(userDetail.auth_provider)">
                {{ AUTH_PROVIDER_LABELS[userDetail.auth_provider] || userDetail.auth_provider || '-' }}
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
