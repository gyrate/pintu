import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import path from 'path';
import sharp from 'sharp';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET_NAME = 'pintu-images';

// 确保 Bucket 存在
async function ensureBucket() {
  try {
      // 避免在模块加载时直接调用网络请求，防止无网络环境下 crash
      // 只有在第一次调用时执行
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets) return; // 可能是 mock client
      const bucket = buckets?.find(b => b.name === BUCKET_NAME);
      if (!bucket) {
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
      }
  } catch (err) {
      console.warn('ensureBucket failed (safe to ignore if offline):', err);
  }
}

// 初始化
// 移除顶层调用，改为懒加载或者允许失败
ensureBucket().catch(e => console.warn('Bucket check skipped:', e.message));

// 获取图片列表
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const { data: images, error, count } = await supabaseAdmin
            .from('images')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(start, end);
        
        if (error) throw error;
        
        // 生成 URL
        const imagesWithUrl = images.map((img: any) => ({
            ...img,
            url: supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(img.storage_path).data.publicUrl
        }));

        res.json({
            list: imagesWithUrl,
            total: count,
            page,
            pageSize
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 上传图片
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { taskId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. 上传到 Supabase Storage
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 2. 获取公开链接
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // 3. 记录到 images 表
    // 这里我们暂时不需要 file_size, width, height 的精确值（Sharp 可以获取，但为了性能先存基本的）
    // 或者用 sharp 获取一下元数据？为了拼图质量，最好获取一下。
    // 但用户需求里提到了 Sharp 在拼图时用。这里上传时简单处理。
    // 如果必须获取宽高，可以用 sharp(file.buffer).metadata()
    
    // 既然已经安装了 sharp，那就用一下
    const metadata = await sharp(file.buffer).metadata();

    const { data: image, error: dbError } = await supabaseAdmin
      .from('images')
      .insert([
        {
          original_name: file.originalname,
          storage_path: filePath,
          width: metadata.width || 0,
          height: metadata.height || 0,
          file_size: file.size,
          // url: publicUrl // 数据库没设计 url 字段，而是 storage_path，不过前端可能需要 url
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. 如果有 taskId，关联到任务 (Optional，根据 API 定义，上传时可能带 taskId)
    if (taskId) {
        // 先检查 task 是否存在
        const { data: task } = await supabaseAdmin.from('tasks').select('id').eq('id', taskId).single();
        if (task) {
             // 获取当前最大 sort_order
            const { data: maxOrderData } = await supabaseAdmin
                .from('task_images')
                .select('sort_order')
                .eq('task_id', taskId)
                .order('sort_order', { ascending: false })
                .limit(1)
                .single();
            
            const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

            await supabaseAdmin.from('task_images').insert({
                task_id: taskId,
                image_id: image.id,
                sort_order: nextOrder
            });
        }
    }

    res.json({
      ...image,
      url: publicUrl
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除图片
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 1. 获取图片信息
        const { data: image } = await supabaseAdmin.from('images').select('*').eq('id', id).single();
        if (!image) return res.status(404).json({ error: 'Image not found' });

        // 2. 删除 Storage 文件
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([image.storage_path]);

        // 3. 删除数据库记录
        const { error } = await supabaseAdmin.from('images').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
