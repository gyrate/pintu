<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Grid, List } from '@element-plus/icons-vue';

const images = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedIds = ref<string[]>([]);
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
    const data = await api.getImages(pagination.currentPage, pagination.pageSize, searchQuery.value);
    images.value = data.list;
    pagination.total = data.total;
  } catch (error: any) {
    ElMessage.error('加载图片失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadImages();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

// Grid 模式下手动处理选择（其实 v-model 也可以，但为了和 table 同步，可能需要注意）
// 如果 viewMode 切换，selectedIds 应该保留吗？保留比较好。
// 但是 Table 的 selection-change 会覆盖 selectedIds。
// 当切换到 Table 时，需要 toggleRowSelection。这比较麻烦。
// 简单点：切换视图清空选择，或者尽量让 Table 根据 selectedIds 回显。
// Element Plus Table 的 toggleRowSelection 需要 row 对象。
// 策略：简单处理，切换视图清空已选。
const handleViewModeChange = (mode: 'grid' | 'table') => {
    viewMode.value = mode;
    selectedIds.value = [];
};

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return;
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 张图片吗？此操作不可恢复。`, '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.batchDeleteImages(selectedIds.value);
      ElMessage.success('批量删除成功');
      loadImages();
      selectedIds.value = [];
    } catch (error: any) {
      ElMessage.error('批量删除失败');
    }
  });
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
      <div style="display: flex; gap: 20px; align-items: center;">
        <div style="display: flex; gap: 10px;">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索图片名" 
            style="width: 200px" 
            clearable 
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button 
            type="danger" 
            :disabled="selectedIds.length === 0" 
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
        <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
            <el-radio-button label="grid">
                <el-icon><Grid /></el-icon> 卡片
            </el-radio-button>
            <el-radio-button label="table">
                <el-icon><List /></el-icon> 列表
            </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-loading="loading">
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="image-grid">
            <div v-for="img in images" :key="img.id" class="image-card" :class="{ 'selected': selectedIds.includes(img.id) }">
                <div class="card-checkbox">
                    <input type="checkbox" :value="img.id" v-model="selectedIds" style="width: 18px; height: 18px; cursor: pointer;">
                </div>
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
        <el-table 
            v-else 
            :data="images" 
            style="width: 100%"
            @selection-change="handleSelectionChange"
        >
            <el-table-column type="selection" width="55" />
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
    position: relative;
}
.image-card.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
.card-checkbox {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 10;
    background: rgba(255,255,255,0.8);
    border-radius: 4px;
    padding: 2px;
    display: flex;
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
