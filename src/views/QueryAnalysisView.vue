<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  CalendarOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  LeftOutlined,
} from '@ant-design/icons-vue'
import { statsService } from '@/services/statsService'
import type { QueryStats, TopUserItem, QueryItem } from '@/types/stats'
import { formatDateTime } from '@/utils/formatter'

// 统计数据
const stats = ref<QueryStats>({
  total_queries: 0,
  today_queries: 0,
  this_month_queries: 0,
})
const loadingStats = ref(false)

// 前十用户
const selectedMonth = ref('')
const topUsers = ref<TopUserItem[]>([])
const loadingTopUsers = ref(false)

// Query 列表
const selectedUserId = ref<string | null>(null)
const queries = ref<QueryItem[]>([])
const loadingQueries = ref(false)
const queryPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
})

// 获取当前月份 (YYYY-MM 格式)
const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 月份选项 (最近12个月)
const monthOptions = computed(() => {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    options.push({ value, label })
  }
  return options
})

// 前十用户表格列
const topUsersColumns = [
  {
    title: '排名',
    key: 'rank',
    width: 60,
  },
  {
    title: '用户ID',
    dataIndex: 'user_id',
    key: 'user_id',
    ellipsis: true,
  },
  {
    title: 'Query 次数',
    dataIndex: 'query_count',
    key: 'query_count',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
  },
]

// Query 列表表格列
const queryColumns = [
  {
    title: 'Query 内容',
    dataIndex: 'query',
    key: 'query',
    ellipsis: true,
  },
  {
    title: '结果数',
    dataIndex: 'result_count',
    key: 'result_count',
    width: 80,
  },
  {
    title: '耗时(ms)',
    dataIndex: 'duration_ms',
    key: 'duration_ms',
    width: 100,
  },
  {
    title: '时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
]

// 加载统计数据
const loadStats = async () => {
  loadingStats.value = true
  try {
    stats.value = await statsService.getQueryStats()
  } catch (e) {
    console.error('Failed to load query stats:', e)
    message.error('加载统计数据失败')
  } finally {
    loadingStats.value = false
  }
}

// 加载前十用户
const loadTopUsers = async () => {
  loadingTopUsers.value = true
  try {
    const result = await statsService.getTopUsers(selectedMonth.value || undefined)
    topUsers.value = result.items
    if (!selectedMonth.value) {
      selectedMonth.value = result.month
    }
  } catch (e) {
    console.error('Failed to load top users:', e)
    message.error('加载前十用户失败')
  } finally {
    loadingTopUsers.value = false
  }
}

// 月份变化
const handleMonthChange = () => {
  loadTopUsers()
}

// 查看用户 Query 列表
const viewUserQueries = (userId: string) => {
  selectedUserId.value = userId
  queryPagination.value.current = 1
  loadQueries()
}

// 加载 Query 列表
const loadQueries = async () => {
  if (!selectedUserId.value) return
  loadingQueries.value = true
  try {
    const result = await statsService.getQueryList(
      selectedUserId.value,
      queryPagination.value.current,
      queryPagination.value.pageSize
    )
    queries.value = result.items
    queryPagination.value.total = result.total
  } catch (e) {
    console.error('Failed to load queries:', e)
    message.error('加载 Query 列表失败')
  } finally {
    loadingQueries.value = false
  }
}

// Query 列表分页变化
const handleQueryTableChange = (pag: any) => {
  queryPagination.value.current = pag.current
  queryPagination.value.pageSize = pag.pageSize
  loadQueries()
}

// 返回前十列表
const backToTopUsers = () => {
  selectedUserId.value = null
  queries.value = []
}

// 刷新数据
const refresh = () => {
  loadStats()
  loadTopUsers()
  if (selectedUserId.value) {
    loadQueries()
  }
}

onMounted(() => {
  selectedMonth.value = getCurrentMonth()
  loadStats()
  loadTopUsers()
})
</script>

<template>
  <div class="query-analysis">
    <a-page-header title="Query 分析" sub-title="查看 Query 使用统计和用户搜索行为">
      <template #extra>
        <a-button @click="refresh" :loading="loadingStats || loadingTopUsers">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="8">
        <a-card :loading="loadingStats">
          <a-statistic
            title="总 Query 数"
            :value="stats.total_queries"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix><SearchOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :loading="loadingStats">
          <a-statistic
            title="今日 Query"
            :value="stats.today_queries"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix><CalendarOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :loading="loadingStats">
          <a-statistic
            title="本月 Query"
            :value="stats.this_month_queries"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix><BarChartOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 前十用户视图 -->
    <a-card v-if="!selectedUserId" class="main-card">
      <template #title>
        <a-space>
          <span>月度 Query 前十用户</span>
          <a-select
            v-model:value="selectedMonth"
            :options="monthOptions"
            style="width: 140px"
            @change="handleMonthChange"
          />
        </a-space>
      </template>

      <a-table
        :columns="topUsersColumns"
        :data-source="topUsers"
        :loading="loadingTopUsers"
        :pagination="false"
        row-key="user_id"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'rank'">
            <a-badge
              :count="index + 1"
              :number-style="{
                backgroundColor: index < 3 ? ['#f5222d', '#fa8c16', '#faad14'][index] : '#d9d9d9',
              }"
            />
          </template>
          <template v-else-if="column.key === 'user_id'">
            <a-typography-text copyable :content="record.user_id">
              <UserOutlined style="margin-right: 8px" />
              {{ record.user_id }}
            </a-typography-text>
          </template>
          <template v-else-if="column.key === 'query_count'">
            <a-tag color="blue">{{ record.query_count }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewUserQueries(record.user_id)">
              查看详情
            </a-button>
          </template>
        </template>

        <template #emptyText>
          <a-empty description="本月暂无数据" />
        </template>
      </a-table>
    </a-card>

    <!-- Query 列表视图 -->
    <a-card v-else class="main-card">
      <template #title>
        <a-space>
          <a-button type="link" @click="backToTopUsers">
            <LeftOutlined />
            返回
          </a-button>
          <a-divider type="vertical" />
          <UserOutlined />
          <span>{{ selectedUserId }} 的 Query 历史</span>
        </a-space>
      </template>

      <a-table
        :columns="queryColumns"
        :data-source="queries"
        :loading="loadingQueries"
        :pagination="{
          current: queryPagination.current,
          pageSize: queryPagination.pageSize,
          total: queryPagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        row-key="id"
        @change="handleQueryTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'query'">
            <a-tooltip :title="record.query" placement="topLeft">
              <span>{{ record.query }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'result_count'">
            {{ record.result_count ?? '-' }}
          </template>
          <template v-else-if="column.key === 'duration_ms'">
            <span v-if="record.duration_ms">
              <ClockCircleOutlined style="margin-right: 4px" />
              {{ record.duration_ms }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ record.created_at ? formatDateTime(record.created_at) : '-' }}
          </template>
        </template>

        <template #emptyText>
          <a-empty description="暂无 Query 记录" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.query-analysis {
  padding: 24px;
}

.stats-row {
  margin-bottom: 24px;
}

.main-card {
  margin-bottom: 24px;
}
</style>
