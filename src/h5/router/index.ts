import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import EditPage from '../pages/EditPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/edit/:id?', // id is optional for creating new task (or handle create separately)
    name: 'Edit',
    component: EditPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(), // H5 使用 Hash 模式避免服务端配置问题，或者用 WebHistory
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
