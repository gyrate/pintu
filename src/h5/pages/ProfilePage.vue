<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { showConfirmDialog } from 'vant';

const router = useRouter();
const userStore = useUserStore();

const onLogout = () => {
  showConfirmDialog({
    title: '提示',
    message: '确认退出登录吗？',
  })
    .then(() => {
      userStore.logout();
      router.replace('/login');
    })
    .catch(() => {
      // on cancel
    });
};
</script>

<template>
  <div class="profile-page">
    <van-nav-bar
      title="个人中心"
      left-arrow
      @click-left="router.back()"
    />

    <div class="user-info">
      <van-image
        round
        width="80px"
        height="80px"
        :src="userStore.user?.avatar_url"
      />
      <h2 class="nickname">{{ userStore.user?.nickname }}</h2>
      <p class="phone">{{ userStore.user?.phone }}</p>
    </div>

    <van-cell-group inset style="margin-top: 20px;">
      <van-cell title="关于我们" is-link />
      <van-cell title="意见反馈" is-link />
    </van-cell-group>

    <div style="margin: 20px 16px;">
      <van-button block round type="danger" @click="onLogout">退出登录</van-button>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.user-info {
  background: white;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nickname {
  margin: 12px 0 4px;
  font-size: 18px;
  color: #323233;
}

.phone {
  margin: 0;
  font-size: 14px;
  color: #969799;
}
</style>
