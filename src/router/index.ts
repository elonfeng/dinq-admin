/**
 * Vue Router configuration
 * Defines routes with authentication guard
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        title: '登录',
        requiresAuth: false,
      },
    },
    {
      path: '/',
      redirect: '/verification-review',
    },
    // {
    //   path: '/monitor',
    //   name: 'monitor',
    //   component: () => import('@/views/MonitorView.vue'),
    //   meta: {
    //     title: '系统监控',
    //     icon: 'DashboardOutlined',
    //     requiresAuth: true,
    //   },
    // },
    // {
    //   path: '/task-history',
    //   name: 'task-history',
    //   component: () => import('@/views/TaskHistoryView.vue'),
    //   meta: {
    //     title: '任务历史',
    //     icon: 'HistoryOutlined',
    //     requiresAuth: true,
    //   },
    // },
    {
      path: '/verification-review',
      name: 'verification-review',
      component: () => import('@/views/VerificationReviewView.vue'),
      meta: {
        title: '认证审核',
        icon: 'SafetyCertificateOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/waiting-list',
      name: 'waiting-list',
      component: () => import('@/views/WaitingListView.vue'),
      meta: {
        title: '等待列表',
        icon: 'TeamOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/notification-send',
      name: 'notification-send',
      component: () => import('@/views/NotificationSendView.vue'),
      meta: {
        title: '发送通知',
        icon: 'NotificationOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/invitation-codes',
      name: 'invitation-codes',
      component: () => import('@/views/InvitationCodeView.vue'),
      meta: {
        title: '邀请码管理',
        icon: 'GiftOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/openings',
      name: 'openings',
      component: () => import('@/views/OpeningsView.vue'),
      meta: {
        title: '职位管理',
        icon: 'TeamOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/contact-requests',
      name: 'contact-requests',
      component: () => import('@/views/ContactRequestView.vue'),
      meta: {
        title: '联系请求',
        icon: 'MessageOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: () => import('@/views/UserManagementView.vue'),
      meta: {
        title: '积分管理',
        icon: 'UserOutlined',
        requiresAuth: true,
      },
    },
    {
      path: '/custom_tool',
      name: 'custom_tool',
      component: () => import('@/views/ToolsView.vue'),
      meta: {
        title: '工具箱',
        icon: 'ToolOutlined',
        requiresAuth: true,
      },
    },
  ],
})

// Navigation guard for authentication and page title
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Update page title
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - Dinq 后台管理系统`
  }

  // Check authentication
  const requiresAuth = to.meta.requiresAuth !== false // Default to true

  if (requiresAuth && !authStore.isLoggedIn) {
    // Redirect to login if not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isLoggedIn) {
    // Redirect to home if already logged in
    next({ name: 'monitor' })
  } else {
    next()
  }
})

export default router
