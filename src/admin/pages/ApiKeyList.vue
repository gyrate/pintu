<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Key, Refresh } from '@element-plus/icons-vue';

const loading = ref(false);
const users = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.getUsers(currentPage.value, pageSize.value);
    users.value = res.list;
    total.value = res.total;
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchUsers();
};

const generateKey = () => {
  return 'sk-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const dialogVisible = ref(false);
const editingUser = ref<any>(null);
const editingKey = ref('');
const saving = ref(false);

const openEditDialog = (user: any) => {
  editingUser.value = user;
  editingKey.value = user.api_key || '';
  dialogVisible.value = true;
};

const handleGenerateNewKey = () => {
  editingKey.value = generateKey();
};

const handleSaveKey = async () => {
  if (!editingUser.value) return;
  
  saving.value = true;
  try {
    await api.updateUser(editingUser.value.id, { api_key: editingKey.value });
    ElMessage.success('API Key 更新成功');
    dialogVisible.value = false;
    fetchUsers();
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="apikey-list">
    <div class="header-actions">
      <h2>API Key 管理</h2>
      <el-button @click="fetchUsers" :icon="Refresh" circle />
    </div>

    <el-table :data="users" v-loading="loading" border stripe>
      <el-table-column prop="nickname" label="昵称" width="150" />
      <el-table-column prop="phone" label="手机号" width="150" />
      <el-table-column label="API Key" min-width="300">
        <template #default="scope">
          <el-tag v-if="scope.row.api_key" type="success" effect="plain" class="api-key-tag">
            {{ scope.row.api_key }}
          </el-tag>
          <span v-else class="text-gray">未配置</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" link @click="openEditDialog(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="编辑 API Key"
      width="500px"
    >
      <div v-if="editingUser">
        <p style="margin-bottom: 10px;">
          用户: <strong>{{ editingUser.nickname }}</strong> ({{ editingUser.phone }})
        </p>
        <el-input v-model="editingKey" placeholder="sk-xxxxxxxx" clearable>
          <template #append>
            <el-button :icon="Refresh" @click="handleGenerateNewKey" title="生成新 Key">
              生成
            </el-button>
          </template>
        </el-input>
        <p class="text-gray" style="margin-top: 8px; font-size: 12px;">
          点击“生成”按钮将随机生成一个新的 Key 覆盖当前输入框的值。点击“保存”后生效。
        </p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveKey" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.apikey-list {
  padding: 20px;
  background: white;
  border-radius: 8px;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header-actions h2 {
  margin: 0;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.api-key-tag {
  font-family: monospace;
  font-size: 13px;
}
.text-gray {
  color: #909399;
  font-style: italic;
}
</style>
