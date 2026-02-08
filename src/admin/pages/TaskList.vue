<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const tasks = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedIds = ref<string[]>([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const loadTasks = async () => {
  loading.value = true;
  try {
    const data = await api.getTasks(undefined, pagination.currentPage, pagination.pageSize, searchQuery.value);
    tasks.value = data.list;
    pagination.total = data.total;
  } catch (error: any) {
    ElMessage.error('加载任务失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadTasks();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return;
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个任务吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.batchDeleteTasks(selectedIds.value);
      ElMessage.success('批量删除成功');
      loadTasks();
      selectedIds.value = [];
    } catch (error: any) {
      ElMessage.error('批量删除失败');
    }
  });
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadTasks();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadTasks();
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
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between;">
      <div style="display: flex; gap: 10px;">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索任务名称" 
          style="width: 200px" 
          clearable 
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
      <div>
        <el-button 
          type="danger" 
          :disabled="selectedIds.length === 0" 
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button :icon="Refresh" circle @click="loadTasks" />
      </div>
    </div>

    <el-table 
      :data="tasks" 
      v-loading="loading" 
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="任务名称" min-width="150" show-overflow-tooltip />
      <el-table-column label="所属用户" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <div v-if="scope.row.user">
             <div>{{ scope.row.user.nickname }}</div>
             <div style="font-size: 12px; color: #999;">{{ scope.row.user.phone }}</div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
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
            preview-teleported
            :close-on-press-escape="true"
            :hide-on-click-modal="true"
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
          <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>
</template>
