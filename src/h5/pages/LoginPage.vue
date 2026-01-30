<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { api } from '../api/client';
import { showToast, showDialog } from 'vant';
import SHA256 from 'crypto-js/sha256';

const router = useRouter();
const userStore = useUserStore();

const phone = ref('');
const password = ref('');
const loading = ref(false);

const onLogin = async () => {
  if (!phone.value) {
    showToast('请输入手机号');
    return;
  }
  
  if (!password.value) {
    showToast('请输入密码');
    return;
  }

  loading.value = true;
  try {
    const encryptedPassword = SHA256(password.value).toString();
    const data = await api.login(phone.value, '', encryptedPassword, 'password');
    userStore.login(data.user, data.token);
    showToast('登录成功');
    router.replace('/');
  } catch (error: any) {
    showDialog({
      title: '登录失败',
      message: error.message || '请检查手机号或密码是否正确',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="header">
      <h1>拼图 Pintu</h1>
      <p>记录生活，拼接美好</p>
    </div>

    <van-form @submit="onLogin" style="margin-top: 20px;">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请填写手机号' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.login-page {
  padding-top: 50px;
  height: 100vh;
  background-color: #f7f8fa;
}
.header {
  text-align: center;
  margin-bottom: 30px;
}
.header h1 {
  font-size: 32px;
  color: #1989fa;
  margin-bottom: 10px;
}
.header p {
  color: #969799;
}
</style>
