<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { api } from '../api/client';
import { ElMessage } from 'element-plus';

const results = ref([]);
const loading = ref(false);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const loadResults = async () => {
  loading.value = true;
  try {
    const data = await api.getResults(pagination.currentPage, pagination.pageSize);
    results.value = data.list;
    pagination.total = data.total;
  } catch (error: any) {
    ElMessage.error('加载生成结果失败');
  } finally {
    loading.value = false;
  }
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
    <div slot="header" class="clearfix">
      <span>生成结果管理</span>
    </div>
    <el-table :data="results" v-loading="loading" style="width: 100%">
      <el-table-column label="生成图片" width="150">
        <template #default="scope">
          <el-image 
            :src="scope.row.export_url" 
            :preview-src-list="[scope.row.export_url]"
            preview-teleported
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
