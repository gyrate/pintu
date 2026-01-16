<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';

const stats = ref({
  users: 0,
  tasks: 0,
  images: 0
});

onMounted(async () => {
  try {
    const users = await api.getUsers();
    const tasks = await api.getTasks();
    stats.value.users = users.length;
    stats.value.tasks = tasks.length;
    // Image count requires separate API or calculation, skip for now or estimate
  } catch (error) {
    console.error(error);
  }
});
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>总用户数</span>
            </div>
          </template>
          <div class="card-value">{{ stats.users }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>总任务数</span>
            </div>
          </template>
          <div class="card-value">{{ stats.tasks }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
            </div>
          </template>
          <div class="card-value" style="font-size: 20px; line-height: 36px;">运行正常</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
}
</style>
