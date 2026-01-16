<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import { ElMessage } from 'element-plus';

const users = ref([]);
const loading = ref(false);

const loadUsers = async () => {
  loading.value = true;
  try {
    const data = await api.getUsers();
    users.value = data;
  } catch (error: any) {
    ElMessage.error('加载用户失败');
  } finally {
    loading.value = false;
  }
};

onMounted(loadUsers);
</script>

<template>
  <el-card>
    <el-table :data="users" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="180" show-overflow-tooltip />
      <el-table-column label="头像" width="80">
        <template #default="scope">
          <el-avatar :src="scope.row.avatar_url" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="created_at" label="注册时间">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
