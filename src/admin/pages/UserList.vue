<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { api } from '../api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const isSuperAdmin = computed(() => {
    // 允许 superAdmin   编辑角色
    const roles = userStore.user?.roles || [];
    return roles.includes('superAdmin');
});

const users = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const isEdit = ref(false);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const formRef = ref();
const form = reactive({
  id: '',
  phone: '',
  nickname: '',
  password: '', // 仅新增时有效
  roles: [] as string[],
});

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const data = await api.getUsers(pagination.currentPage, pagination.pageSize);
    users.value = data.list;
    pagination.total = data.total;
  } catch (error: any) {
    ElMessage.error('加载用户失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadUsers();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadUsers();
};

const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '新增用户';
  form.id = '';
  form.phone = '';
  form.nickname = '';
  form.password = '';
  form.roles = ['user'];
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  dialogTitle.value = '编辑用户';
  form.id = row.id;
  form.phone = row.phone;
  form.nickname = row.nickname;
  form.password = ''; // 编辑时不回显密码
  form.roles = row.roles || ['user'];
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复。', '提示', {
      type: 'warning',
    });
    await api.deleteUser(row.id);
    ElMessage.success('删除成功');
    loadUsers();
  } catch (error) {
    // Cancelled
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await api.updateUser(form.id, {
            phone: form.phone,
            nickname: form.nickname,
            roles: form.roles,
          });
          ElMessage.success('更新成功');
        } else {
          await api.createUser({
            phone: form.phone,
            nickname: form.nickname,
            password: form.password,
          });
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        loadUsers();
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      }
    }
  });
};

const handleResetPassword = async (user: any) => {
  try {
    const { value: password } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: '密码长度至少为 6 位',
    });

    if (password) {
        await api.resetPassword(user.id, password);
        ElMessage.success('密码重置成功');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
        ElMessage.error(error.message || '操作失败');
    }
  }
};

onMounted(loadUsers);
</script>

<template>
  <el-card>
    <div style="margin-bottom: 20px;" v-if="isSuperAdmin">
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>
    <el-table :data="users" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="180" show-overflow-tooltip />
      <el-table-column label="头像" width="80">
        <template #default="scope">
          <el-avatar :src="scope.row.avatar_url" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column label="角色" min-width="150">
        <template #default="scope">
          <el-tag
            v-for="role in (scope.row.roles || ['user'])"
            :key="role"
            :type="role === 'superAdmin' ? 'danger' : (role === 'admin' ? 'warning' : 'info')"
            style="margin-right: 4px;"
            size="small"
          >
            {{ role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="created_at" label="注册时间">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right" v-if="isSuperAdmin">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button link type="primary" size="small" @click="handleResetPassword(scope.row)">
            重置密码
          </el-button>
          <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
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

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item v-if="isSuperAdmin" label="角色">
          <el-checkbox-group v-model="form.roles">
            <el-checkbox label="user">普通用户</el-checkbox>
            <el-checkbox label="admin">管理员</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入初始密码 (至少6位)" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>
