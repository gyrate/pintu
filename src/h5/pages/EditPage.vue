<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/client';
import { showToast, showLoadingToast, closeToast, showImagePreview } from 'vant';
import { ArrowUp, ArrowDown, X, Upload } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const taskId = route.params.id as string;

const task = ref<any>({});
const images = ref<any[]>([]);
const previewUrl = ref('');
const showPreview = ref(false);
const saving = ref(false);

const directionOptions = [
  { text: '向下拼接', value: 'down' },
  { text: '向右拼接', value: 'right' },
];

onMounted(async () => {
  if (taskId) {
    await loadTask();
  }
});

const loadTask = async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true });
  try {
    const data = await api.getTask(taskId);
    task.value = data;
    images.value = data.images || [];
    if (data.status === 'completed' && data.export_url) {
      previewUrl.value = data.export_url;
    }
  } catch (error: any) {
    showToast(error.message || '加载失败');
  } finally {
    closeToast();
  }
};

const saveTask = async (silent = false) => {
  if (!silent) saving.value = true;
  try {
    const imageIds = images.value.map(img => img.id);
    await api.updateTask(taskId, {
      name: task.value.name,
      direction: task.value.direction,
      images: imageIds
    });
    if (!silent) showToast('保存成功');
  } catch (error: any) {
    showToast(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const afterRead = async (file: any) => {
  // file.file is the actual File object
  if (!file || !file.file) return;

  const toast = showLoadingToast({ message: '上传中...', forbidClick: true });
  try {
    const uploadedImage = await api.uploadImage(file.file, taskId);
    images.value.push(uploadedImage);
    await saveTask(true); // Auto save
    toast.close();
  } catch (error: any) {
    toast.close();
    showToast(error.message || '上传失败');
  }
};

const deleteImage = async (index: number) => {
  images.value.splice(index, 1);
  await saveTask(true);
};

const moveImage = (index: number, offset: number) => {
  const newIndex = index + offset;
  if (newIndex < 0 || newIndex >= images.value.length) {
    return;
  }
  
  const temp = images.value[index];
  images.value[index] = images.value[newIndex];
  images.value[newIndex] = temp;
  
  saveTask(true);
};

const onExport = async () => {
  if (images.value.length < 1) {
    showToast('请至少添加一张图片');
    return;
  }
  
  await saveTask(true); // Ensure synced

  const toast = showLoadingToast({ message: '正在拼接...', forbidClick: true, duration: 0 });
  try {
    const result = await api.exportTask(taskId);
    previewUrl.value = result.downloadUrl;
    showPreview.value = true;
    toast.close();
  } catch (error: any) {
    toast.close();
    showToast(error.message || '拼接失败');
  }
};

const viewPreview = () => {
  if (previewUrl.value) {
    showImagePreview([previewUrl.value]);
  }
};
</script>

<template>
  <div class="edit-page">
    <van-nav-bar
      title="编辑拼图"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    >
      <template #right>
        <span @click="saveTask(false)" class="nav-btn">保存</span>
      </template>
    </van-nav-bar>

    <div class="settings-panel">
      <van-field v-model="task.name" label="任务名称" placeholder="请输入任务名称" />
      <div class="direction-setting">
        <span class="label">拼接方向</span>
        <van-radio-group v-model="task.direction" direction="horizontal" @change="saveTask(true)">
          <van-radio name="down">向下</van-radio>
          <van-radio name="right">向右</van-radio>
        </van-radio-group>
      </div>
    </div>

    <div class="image-list">
      <div v-for="(img, index) in images" :key="img.id" class="image-item">
        <div class="img-wrapper">
          <van-image fit="cover" :src="img.url" class="thumbnail" />
        </div>
        <div class="actions">
          <van-button size="mini" icon="arrow-up" @click="moveImage(index, -1)" :disabled="index === 0">
            <template #icon><ArrowUp :size="14"/></template>
          </van-button>
          <van-button size="mini" icon="arrow-down" @click="moveImage(index, 1)" :disabled="index === images.length - 1">
            <template #icon><ArrowDown :size="14"/></template>
          </van-button>
          <van-button size="mini" type="danger" icon="cross" @click="deleteImage(index)">
             <template #icon><X :size="14"/></template>
          </van-button>
        </div>
      </div>
      
      <!-- Upload Button -->
      <van-uploader :after-read="afterRead" class="uploader-wrapper">
        <div class="upload-btn">
          <Upload :size="24" color="#969799" />
          <span>添加图片</span>
        </div>
      </van-uploader>
    </div>

    <div class="footer-action">
      <van-button type="primary" block round @click="onExport">生成长图</van-button>
    </div>

    <!-- Result Dialog -->
    <van-dialog v-model:show="showPreview" title="拼图完成" show-cancel-button confirm-button-text="查看大图" @confirm="viewPreview">
      <div class="preview-content">
        <van-image :src="previewUrl" fit="contain" height="200" />
        <p class="tip">长按图片保存到相册</p>
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.edit-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 100px;
}

.nav-btn {
  color: #1989fa;
  font-size: 14px;
  cursor: pointer;
}

.settings-panel {
  background: white;
  margin-bottom: 12px;
  padding-bottom: 8px;
}

.direction-setting {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  font-size: 14px;
}

.direction-setting .label {
  width: 6.2em;
  margin-right: 12px;
  color: #323233;
}

.image-list {
  padding: 12px;
}

.image-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.img-wrapper {
  width: 80px;
  height: 80px;
  margin-right: 12px;
  flex-shrink: 0;
}

.thumbnail {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.uploader-wrapper {
  width: 100%;
  display: block;
}

.upload-btn {
  width: 100%;
  height: 60px;
  border: 1px dashed #ebedf0;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #969799;
  font-size: 14px;
}

.footer-action {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 99;
  box-sizing: border-box;
}

.preview-content {
  text-align: center;
  padding: 16px;
}

.preview-content .tip {
  font-size: 12px;
  color: #969799;
  margin-top: 8px;
}
</style>
