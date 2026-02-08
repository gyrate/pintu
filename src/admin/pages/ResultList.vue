<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const results = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedIds = ref<string[]>([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const loadResults = async () => {
  loading.value = true;
  try {
    const data = await api.getResults(pagination.currentPage, pagination.pageSize, searchQuery.value);
    results.value = data.list;
    pagination.total = data.total;
  } catch (error: any) {
    ElMessage.error('加载生成结果失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadResults();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return;
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条生成记录吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      // 结果也是 Task，所以调用 batchDeleteTasks
      await api.batchDeleteTasks(selectedIds.value);
      ElMessage.success('批量删除成功');
      loadResults();
      selectedIds.value = [];
    } catch (error: any) {
      ElMessage.error('批量删除失败');
    }
  });
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadResults();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadResults();
};

const handleViewAll = () => {
    // 这个功能在当前 API 设计下比较模糊。
    // “点击查看生成的所有图片”可能意味着查看该任务的所有输入图片 + 输出图片？
    // 或者是一个相册模式查看所有任务的输出？
    // 根据需求描述：“罗列所有生成结果...可以点击查看生成的所有图片”，可能是指点击某个结果，查看该结果的大图。
    // 但如果有多个结果，可能需要幻灯片。
    // 目前每个任务只有一个 export_url。
    ElMessage.info('暂支持单张预览，更多功能开发中');
};

onMounted(loadResults);
</script>

<template>
  <el-card>
    <div slot="header" class="clearfix" style="margin-bottom: 20px;">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">生成结果管理</div>
      <div style="display: flex; justify-content: space-between;">
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
          <el-button :icon="Refresh" circle @click="loadResults" />
        </div>
      </div>
    </div>

    <el-table 
      :data="results" 
      v-loading="loading" 
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="生成图片" width="150">
        <template #default="scope">
          <el-image 
            :src="scope.row.export_url" 
            :preview-src-list="[scope.row.export_url]"
            preview-teleported
            :close-on-press-escape="true"
            :hide-on-click-modal="true"
            style="width: 100px; height: 100px; object-fit: contain; border: 1px solid #eee;"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="任务信息" min-width="200">
        <template #default="scope">
            <div style="font-weight: bold;">{{ scope.row.name }}</div>
            <div style="color: #666; font-size: 12px;">ID: {{ scope.row.id }}</div>
            <div style="margin-top: 5px;">
                <el-tag size="small">{{ scope.row.direction === 'down' ? '竖向拼接' : '横向拼接' }}</el-tag>
            </div>
        </template>
      </el-table-column>

      <el-table-column prop="updated_at" label="生成时间" width="180">
        <template #default="scope">
          {{ new Date(scope.row.updated_at).toLocaleString() }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-link :href="scope.row.export_url" target="_blank" type="primary" :underline="false">
            下载原图
          </el-link>
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
