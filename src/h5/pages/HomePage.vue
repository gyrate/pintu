<script setup lang="ts">
import { ref } from 'vue';
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
const page = ref(1);
const pageSize = 10;
const searchValue = ref('');
const sortValue = ref('desc');
const sortOptions = [
  { text: '从新到旧', value: 'desc' },
  { text: '从旧到新', value: 'asc' },
];

const onLoad = async () => {
  try {
    const data = await api.getTasks(
      userStore.user.id,
      page.value,
      pageSize,
      searchValue.value,
      sortValue.value
    );
    
    // 兼容返回格式
    const list = Array.isArray(data) ? data : (data.list || []);
    const total = Array.isArray(data) ? list.length : (data.total || 0);

    if (page.value === 1) {
      tasks.value = list;
    } else {
      tasks.value.push(...list);
    }

    // 如果返回的数据少于 pageSize，说明没有更多了
    if (list.length < pageSize || tasks.value.length >= total) {
      finished.value = true;
    } else {
      page.value++;
    }
  } catch (error) {
    console.error(error);
    showToast('加载失败');
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  page.value = 1;
  finished.value = false;
  loading.value = true; // 手动触发 loading 状态
  onLoad();
};

const onSortChange = () => {
  onSearch(); // 排序改变等同于重新搜索
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

    <div class="filter-bar">
      <van-search
        v-model="searchValue"
        placeholder="搜索任务名称"
        @search="onSearch"
        @clear="onSearch"
        shape="round"
        background="#fff"
      />
      <van-dropdown-menu>
        <van-dropdown-item v-model="sortValue" :options="sortOptions" @change="onSortChange" />
      </van-dropdown-menu>
    </div>

    <div class="list-container">
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
    </div>

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

/* 固定搜索栏和筛选栏 */
.filter-bar {
  position: sticky;
  top: 46px; /* van-nav-bar height */
  z-index: 10;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

:deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 44px;
}

:deep(.van-search) {
  padding: 10px 12px;
}

.list-container {
  padding-top: 10px;
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
