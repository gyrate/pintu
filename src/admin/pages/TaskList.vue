<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';

const tasks = ref([]);
const loading = ref(false);

const loadTasks = async () => {
  loading.value = true;
  try {
    const data = await api.getTasks();
    tasks.value = data;
  } catch (error: any) {
    ElMessage.error('加载任务失败');
  } finally {
    loading.value = false;
  }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该任务吗？', '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.deleteTask(row.id);
      ElMessage.success('删除成功');
      loadTasks();
    } catch (error: any) {
      ElMessage.error('删除失败');
    }
  });
};

onMounted(loadTasks);
</script>

<template>
  <el-card>
    <el-table :data="tasks" v-loading="loading" style="width: 100%">
      <el-table-column prop="name" label="任务名称" width="200" />
      <el-table-column prop="direction" label="拼接方向" width="100">
        <template #default="scope">
          <el-tag>{{ scope.row.direction === 'down' ? '向下' : '向右' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'completed' ? 'success' : 'info'">
            {{ scope.row.status === 'completed' ? '已完成' : '编辑中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="预览图" width="100">
        <template #default="scope">
          <el-image 
            v-if="scope.row.export_url" 
            :src="scope.row.export_url" 
            :preview-src-list="[scope.row.export_url]"
            style="width: 50px; height: 50px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="100">
        <template #default="scope">
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
