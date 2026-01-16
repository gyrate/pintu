<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { api } from '../api/client';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { Plus, User } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const tasks = ref<any[]>([]);
const loading = ref(false);
const finished = ref(false);

const onLoad = async () => {
  try {
    const data = await api.getTasks(userStore.user.id);
    tasks.value = data;
    finished.value = true;
  } catch (error) {
    console.error(error);
    showToast('加载失败');
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

const onCreateTask = async () => {
  showLoadingToast({ message: '创建中...', forbidClick: true });
  try {
    const taskName = `拼图任务 ${new Date().toLocaleString()}`;
    const newTask = await api.createTask({
      user_id: userStore.user.id,
      name: taskName,
      direction: 'down'
    });
    closeToast();
    router.push(`/edit/${newTask.id}`);
  } catch (error: any) {
    showToast(error.message || '创建失败');
  }
};

const goToEdit = (id: string) => {
  router.push(`/edit/${id}`);
};

const goToProfile = () => {
  router.push('/profile');
};
</script>

<template>
  <div class="home-page">
    <van-nav-bar title="我的拼图" fixed placeholder>
      <template #right>
        <User @click="goToProfile" :size="20" />
      </template>
    </van-nav-bar>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <div v-for="task in tasks" :key="task.id" class="task-card" @click="goToEdit(task.id)">
        <div class="task-info">
          <h3>{{ task.name }}</h3>
          <p class="time">{{ new Date(task.created_at).toLocaleString() }}</p>
        </div>
        <div class="task-status">
          <van-tag :type="task.status === 'completed' ? 'success' : 'primary'">
            {{ task.status === 'completed' ? '已完成' : '编辑中' }}
          </van-tag>
        </div>
      </div>
    </van-list>

    <div class="fab-button" @click="onCreateTask">
      <Plus :size="24" color="white" />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 80px;
}

.task-card {
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.task-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #323233;
}

.task-info .time {
  margin: 0;
  font-size: 12px;
  color: #969799;
}

.fab-button {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  background-color: #1989fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
  z-index: 100;
  cursor: pointer;
}
</style>
