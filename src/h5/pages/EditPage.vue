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
    // 保存原始状态用于比较 
    task.value.original_name = data.name;
    task.value.original_direction = data.direction;
    task.value.original_image_ids = (data.images || []).map((img: any) => img.id).join(',');
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

const pendingFiles = ref<File[]>([]);

const onOversize = () => {
  showToast('文件大小不能超过 10MB');
};

const afterRead = async (items: any) => {
  if (!items) return;
  
  // 转换为数组统一处理（单选时 items 是对象，多选时是数组）
  const files = Array.isArray(items) ? items : [items];
  
  // 检查数量限制
  const maxCount = 10;
  const currentCount = images.value.length;
  const remainingCount = maxCount - currentCount;
  
  if (remainingCount <= 0) {
    showToast(`最多只能添加 ${maxCount} 张图片`);
    return;
  }
  
  let processFiles = files;
  if (files.length > remainingCount) {
    showToast(`最多只能再添加 ${remainingCount} 张图片，已自动截取`);
    processFiles = files.slice(0, remainingCount);
  }
  
  processFiles.forEach((file: any) => {
    if (!file || !file.file) return;
    
    // 创建临时预览 URL
    const tempUrl = URL.createObjectURL(file.file);
    
    images.value.push({
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 增加随机后缀防止快速添加时 ID 冲突
      url: tempUrl,
      isTemp: true,
      file: file.file
    });
  });
  
  // 仅在本地状态更新，不立即触发保存/上传
};

const saveTask = async (silent = false) => {
  if (!silent) saving.value = true;
  const toast = !silent ? showLoadingToast({ message: '保存中...', forbidClick: true }) : null;
  
  try {
    // 1. 先处理所有待上传的临时图片
    let hasNewUploads = false;
    const uploadPromises = images.value.map(async (img) => {
      if (img.isTemp && img.file) {
        try {
          hasNewUploads = true;
          // 上传图片并获取真实数据
          const uploadedImg = await api.uploadImage(img.file, taskId);
          return uploadedImg; // 返回上传后的图片对象
        } catch (e) {
          console.error('Failed to upload image', e);
          throw e;
        }
      }
      return img; // 已有的图片直接返回
    });

    const processedImages = await Promise.all(uploadPromises);
    
    // 检查是否有变更（图片列表/顺序变更，或有新上传）
    // 简单比较 ID 列表是否变化。注意：新上传的图片 ID 从 'temp-xxx' 变成了真实 ID，所以肯定会变
    // 如果没有新上传，比较 processedImages 的 IDs 和 task.value.images 的 IDs 是否一致
    // 注意：loadTask 加载的数据结构中，task.value.images 是对象数组，需要提取 id 并按顺序组合
    // 并且要确保与 processedImages 中的顺序一致（因为用户可能在页面上拖拽排序了）
    const currentIds = processedImages.map(img => img.id).join(',');
    
    // 获取原始加载时的图片 ID 序列（假设 loadTask 中正确设置了 images.value）
    // 如果没有专门保存 original_image_ids，可以使用 loadTask 时保存的 task.value.images 来比较
    // 但要注意，task.value.images 在 loadTask 后会被赋值给 images.value，并在页面操作中被修改
    // 所以必须依赖 loadTask 中保存的副本，或者在此处直接比较
    // 之前代码逻辑是：const originalIds = (task.value.images || []).map((img: any) => img.id).join(',');
    // 问题在于：loadTask 中 images.value = data.images，之后 task.value.images 并没有被深度克隆或锁定
    // 如果 task.value.images 和 images.value 指向同一个引用，或者 images.value 的修改没影响到 task.value.images
    
    // 正确的做法：在 loadTask 中保存 original_image_ids
    const originalIds = task.value.original_image_ids || '';
    
    console.log('Change detection:', {
        hasNewUploads,
        currentIds,
        originalIds,
        nameChanged: task.value.name !== task.value.original_name,
        dirChanged: task.value.direction !== task.value.original_direction
    });
    
    // 还需要检查其他字段如 name, direction
    const isInfoChanged = task.value.name !== task.value.original_name || 
                          task.value.direction !== task.value.original_direction;
// debugger
    // 只有在数据有变更时才调用更新接口
    if (hasNewUploads || currentIds !== originalIds || isInfoChanged) {
        images.value = processedImages; // 更新本地列表为真实数据
        
        // 2. 更新任务信息（包含所有图片的关联）
        const imageIds = images.value.map(img => img.id);
        await api.updateTask(taskId, {
          name: task.value.name,
          direction: task.value.direction,
          images: imageIds // 传递图片 ID 列表，后端会重新关联
        });
        
        // 重新加载任务以确保数据同步
        await loadTask();
        
        if (!silent) {
          toast?.close();
          showToast('保存成功');
        }
    } else {
        if (!silent) {
          toast?.close();
          showToast('无更改需要保存');
        }
    }

  } catch (error: any) {
    if (!silent) {
      toast?.close();
      showToast(error.message || '保存失败');
    }
    throw error; // 抛出错误以便上层处理（如生成长图时中断）
  } finally {
    saving.value = false;
  }
};

const deleteImage = async (index: number) => {
  images.value.splice(index, 1);
  // await saveTask(true); // 移除自动保存
};

const moveImage = (index: number, offset: number) => {
  const newIndex = index + offset;
  if (newIndex < 0 || newIndex >= images.value.length) {
    return;
  }
  
  const temp = images.value[index];
  images.value[index] = images.value[newIndex];
  images.value[newIndex] = temp;
  
  // saveTask(true); // 移除自动保存，等待用户手动点击保存或生成
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
        <van-radio-group v-model="task.direction" direction="horizontal">
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
      <van-uploader 
        :after-read="afterRead" 
        class="uploader-wrapper" 
        multiple 
        :max-count="10" 
        :max-size="10 * 1024 * 1024"
        @oversize="onOversize"
      >
        <div class="upload-btn">
          <Upload :size="24" color="#969799" />
          <span>添加图片</span>
        </div>
      </van-uploader>
    </div>

    <div class="footer-action">
      <div class="button-group">
        <van-button 
          v-if="task.status === 'completed'" 
          plain 
          type="primary" 
          round 
          class="flex-1"
          @click="showPreview = true"
        >
          查看长图
        </van-button>
        <van-button 
          type="primary" 
          round 
          class="flex-1"
          @click="onExport"
        >
          {{ task.status === 'completed' ? '重新生成长图' : '生成长图' }}
        </van-button>
      </div>
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

/* 强制让 Vant Uploader 的内部容器宽度也撑满 */
.uploader-wrapper :deep(.van-uploader__wrapper),
.uploader-wrapper :deep(.van-uploader__upload),
.uploader-wrapper :deep(.van-uploader__input-wrapper) {
  width: 100%;
  margin: 0;
}

.upload-btn {
  width: 100%;
  height: 100px; /* 调整为与 image-item (80px + padding 20px) 近似的高度 */
  border: 1px dashed #ebedf0;
  background: rgb(234, 243, 232);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #969998;
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

.button-group {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
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
