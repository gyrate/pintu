import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
    meta: { requiresAuth: true, title: '数据概览' }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../pages/UserList.vue'),
    meta: { requiresAuth: true, title: '用户管理' }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../pages/TaskList.vue'),
    meta: { requiresAuth: true, title: '任务管理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
