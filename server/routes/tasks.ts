import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { stitchImages } from '../utils/stitch.js';

const router = Router();
const BUCKET_NAME = 'pintu-images';

// 获取所有生成结果（已完成的任务）
router.get('/results', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const { data: tasks, error, count } = await supabaseAdmin
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('status', 'completed')
            .not('export_url', 'is', null)
            .order('updated_at', { ascending: false })
            .range(start, end);
        
        if (error) throw error;
        res.json({
            list: tasks,
            total: count,
            page,
            pageSize
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 获取任务列表
router.get('/', async (req, res) => {
  try {
    const { userId, search, sort } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    const isAsc = sort === 'asc';

    let query = supabaseAdmin
        .from('tasks')
        .select('*, user:users(nickname, phone)', { count: 'exact' });

    // 搜索
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // 筛选用户
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // 排序和分页
    query = query
        .order('created_at', { ascending: isAsc })
        .range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({
        list: data,
        total: count,
        page,
        pageSize
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取任务详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取任务信息
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (taskError) throw taskError;
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // 获取关联图片
    const { data: taskImages, error: imagesError } = await supabaseAdmin
      .from('task_images')
      .select(`
        sort_order,
        image:images (*)
      `)
      .eq('task_id', id)
      .order('sort_order', { ascending: true });

    if (imagesError) throw imagesError;

    // 格式化返回数据
    const images = taskImages.map((item: any) => ({
        ...item.image,
        sort_order: item.sort_order,
        // 生成临时 URL 或使用 storage_path
        url: supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(item.image.storage_path).data.publicUrl
    }));

    res.json({ ...task, images });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    const { user_id, name, direction, images } = req.body; // images 是 image_id 数组

    if (!user_id || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. 创建 Task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert([{ user_id, name, direction: direction || 'down', status: 'draft' }])
      .select()
      .single();

    if (taskError) throw taskError;

    // 2. 关联图片
    if (images && Array.isArray(images) && images.length > 0) {
      const taskImages = images.map((imageId: string, index: number) => ({
        task_id: task.id,
        image_id: imageId,
        sort_order: index
      }));

      const { error: linkError } = await supabaseAdmin
        .from('task_images')
        .insert(taskImages);

      if (linkError) throw linkError;
    }

    res.json(task);

  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新任务 (包含更新图片顺序/列表)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, direction, images } = req.body; // images: string[] (image_ids in order)

        // 1. 更新基本信息
        const updateData: any = { updated_at: new Date() };
        if (name) updateData.name = name;
        if (direction) updateData.direction = direction;

        const { error: updateError } = await supabaseAdmin
            .from('tasks')
            .update(updateData)
            .eq('id', id);
        
        if (updateError) throw updateError;

        // 2. 更新图片关联 (全量替换)
        if (images && Array.isArray(images)) {
            // 删除旧关联
            await supabaseAdmin.from('task_images').delete().eq('task_id', id);
            
            // 插入新关联
            if (images.length > 0) {
                const taskImages = images.map((imageId: string, index: number) => ({
                    task_id: id,
                    image_id: imageId,
                    sort_order: index
                }));
                const { error: linkError } = await supabaseAdmin.from('task_images').insert(taskImages);
                if (linkError) throw linkError;
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 删除任务
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 导出/拼接图片
router.post('/:id/export', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. 获取任务及图片
        const { data: task } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const { data: taskImages } = await supabaseAdmin
            .from('task_images')
            .select('image:images(storage_path, width, height)')
            .eq('task_id', id)
            .order('sort_order', { ascending: true });
        
        if (!taskImages || taskImages.length === 0) {
            return res.status(400).json({ error: 'No images in this task' });
        }

        const images = taskImages.map((ti: any) => ti.image);

        // 2. 拼接
        const buffer = await stitchImages(images, task.direction as 'down' | 'right');

        // 3. 上传结果
        const fileName = `exports/${id}_${Date.now()}.png`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
        
        if (uploadError) throw uploadError;

        // 4. 获取 URL 并更新任务
        const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName);

        await supabaseAdmin
            .from('tasks')
            .update({ status: 'completed', export_url: publicUrl })
            .eq('id', id);

        res.json({
            downloadUrl: publicUrl,
            fileSize: buffer.length
        });

    } catch (error: any) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
