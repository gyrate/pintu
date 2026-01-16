<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from './stores/user';
import { DataAnalysis, User, List as ListIcon } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isLogin = computed(() => !!userStore.token);
const activeMenu = computed(() => route.path);

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="admin-app">
    <template v-if="isLogin && route.name !== 'Login'">
      <el-container class="layout-container">
        <el-aside width="200px">
          <el-menu
            :default-active="activeMenu"
            router
            class="el-menu-vertical"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
          >
            <div class="logo">拼图管理后台</div>
            <el-menu-item index="/dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据概览</span>
            </el-menu-item>
            <el-menu-item index="/users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/tasks">
              <el-icon><ListIcon /></el-icon>
              <span>任务管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-container>
          <el-header class="header">
            <div class="breadcrumb">
              {{ route.meta.title || '后台管理' }}
            </div>
            <el-button type="danger" link @click="handleLogout">退出登录</el-button>
          </el-header>
          <el-main>
            <router-view />
          </el-main>
        </el-container>
      </el-container>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<style scoped>
.admin-app {
  height: 100vh;
  width: 100vw;
}
.layout-container {
  height: 100%;
}
.el-menu-vertical {
  height: 100%;
  border-right: none;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3649;
}
.header {
  background-color: white;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.breadcrumb {
  font-size: 16px;
  font-weight: 500;
}
</style>
