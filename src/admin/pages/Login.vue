<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { api } from '../api/client';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  phone: '',
  code: ''
});

const loading = ref(false);

const onLogin = async () => {
  if (!form.phone || !form.code) {
    ElMessage.warning('请输入手机号和验证码');
    return;
  }

  loading.value = true;
  try {
    const data = await api.login(form.phone, form.code);
    userStore.login(data.user, data.token);
    ElMessage.success('登录成功');
    router.replace('/');
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="title">拼图应用管理后台</h2>
      </template>
      <el-form :model="form" label-width="0">
        <el-form-item>
          <el-input v-model="form.phone" placeholder="手机号" prefix-icon="Iphone" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.code" type="password" placeholder="验证码 (任意)" prefix-icon="Key" @keyup.enter="onLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="submit-btn" @click="onLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}
.login-card {
  width: 400px;
}
.title {
  text-align: center;
  margin: 0;
  color: #303133;
}
.submit-btn {
  width: 100%;
}
</style>
