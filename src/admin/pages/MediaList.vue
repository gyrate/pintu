<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Grid, List } from '@element-plus/icons-vue';

const images = ref([]);
const loading = ref(false);
const viewMode = ref<'grid' | 'table'>('grid');
const previewVisible = ref(false);
const previewUrl = ref('');
const pagination = reactive({
  currentPage: 1,
  pageSize: 20, // 图片默认每页多展示一些
  total: 0
});

const loadImages = async () => {
  loading.value = true;
  try {
    const data = await api.getImages(pagination.currentPage, pagination.pageSize);
    images.value = data.list;
    pagination.total = data.total;
  } catch (error: any) {
    ElMessage.error('加载图片失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadImages();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadImages();
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
      type: 'warning',
    });
    await api.deleteImage(id);
    ElMessage.success('删除成功');
    loadImages();
  } catch (error) {
    // Cancelled
  }
};

const handlePreview = (url: string) => {
  previewUrl.value = url;
  previewVisible.value = true;
};

onMounted(loadImages);
</script>

<template>
  <el-card>
    <div class="header">
      <div class="title">媒体管理</div>
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button label="grid">
            <el-icon><Grid /></el-icon> 卡片
        </el-radio-button>
        <el-radio-button label="table">
            <el-icon><List /></el-icon> 列表
        </el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading">
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="image-grid">
            <div v-for="img in images" :key="img.id" class="image-card">
                <el-image 
                    :src="img.url" 
                    fit="cover" 
                    class="image-thumb"
                    @click="handlePreview(img.url)"
                />
                <div class="image-info">
                    <div class="image-name" :title="img.original_name">{{ img.original_name }}</div>
                    <div class="image-meta">{{ img.width }}x{{ img.height }} | {{ (img.file_size / 1024).toFixed(1) }}KB</div>
                    <el-button type="danger" link size="small" @click="handleDelete(img.id)">删除</el-button>
                </div>
            </div>
        </div>

        <!-- Table View -->
        <el-table v-else :data="images" style="width: 100%">
            <el-table-column label="预览" width="100">
                <template #default="scope">
                    <el-image 
                        :src="scope.row.url" 
                        :preview-src-list="[scope.row.url]"
                        preview-teleported
                        style="width: 60px; height: 60px"
                    />
                </template>
            </el-table-column>
            <el-table-column prop="original_name" label="文件名" />
            <el-table-column label="尺寸" width="120">
                <template #default="scope">
                    {{ scope.row.width }} x {{ scope.row.height }}
                </template>
            </el-table-column>
            <el-table-column label="大小" width="100">
                <template #default="scope">
                    {{ (scope.row.file_size / 1024).toFixed(1) }} KB
                </template>
            </el-table-column>
            <el-table-column prop="created_at" label="上传时间" width="180">
                <template #default="scope">
                    {{ new Date(scope.row.created_at).toLocaleString() }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
                <template #default="scope">
                    <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>

    <!-- Pagination -->
    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%" top="5vh">
        <div style="text-align: center;">
            <img :src="previewUrl" style="max-width: 100%; max-height: 80vh;" />
        </div>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.title {
    font-size: 18px;
    font-weight: bold;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.image-card {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    transition: shadow 0.3s;
}
.image-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-thumb {
    width: 100%;
    height: 150px;
    cursor: pointer;
    display: block;
}

.image-info {
    padding: 10px;
    font-size: 12px;
}
.image-name {
    font-weight: bold;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.image-meta {
    color: #999;
    margin-bottom: 5px;
}
</style>
