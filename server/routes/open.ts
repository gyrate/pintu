import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import path from 'path';
import sharp from 'sharp';
import { stitchImages } from '../utils/stitch.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET_NAME = 'pintu-images';

// Helper: Ensure bucket exists
async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.find(b => b.name === BUCKET_NAME)) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true
    });
  }
}

// 1. 上传图片
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure bucket exists before upload
    await ensureBucket();

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Get Metadata
    // sharp(file.buffer).metadata() 可能会失败，或者返回 undefined，需要处理
    let metadata: sharp.Metadata;
    try {
        metadata = await sharp(file.buffer).metadata();
    } catch (e) {
        console.warn('Sharp metadata extraction failed:', e);
        // Fallback defaults
        metadata = { width: 0, height: 0 };
    }

    // Save to DB
    const { data: image, error: dbError } = await supabaseAdmin
      .from('images')
      .insert([
        {
          original_name: file.originalname,
          storage_path: filePath,
          width: metadata.width || 0,
          height: metadata.height || 0,
          file_size: file.size,
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    res.json({
      id: image.id,
      url: publicUrl,
      width: image.width,
      height: image.height
    });

  } catch (error: any) {
    console.error('Open API Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. 拼接长图
router.post('/stitch', async (req, res) => {
  try {
    const { image_ids, direction = 'down' } = req.body;

    if (!image_ids || !Array.isArray(image_ids) || image_ids.length === 0) {
      return res.status(400).json({ error: 'image_ids array is required' });
    }

    // Fetch images info from DB
    const { data: images, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .in('id', image_ids);

    if (fetchError) throw fetchError;
    if (!images || images.length !== image_ids.length) {
      return res.status(400).json({ error: 'Some images not found' });
    }

    // Sort images based on input order (DB return order is not guaranteed)
    const sortedImages = image_ids.map(id => images.find(img => img.id === id));

    // Stitch
    const buffer = await stitchImages(sortedImages, direction);

    // Upload Result
    const fileName = `exports/open_api_${Date.now()}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
    
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const meta = await sharp(buffer).metadata();

    // Save result to DB (images table) so it can be managed
    const { data: savedImage, error: dbError } = await supabaseAdmin
      .from('images')
      .insert([
        {
          original_name: `stitched_${Date.now()}.png`,
          storage_path: fileName,
          width: meta.width || 0,
          height: meta.height || 0,
          file_size: buffer.length,
          // You might want to add a flag or type to distinguish generated images if needed
        }
      ])
      .select()
      .single();

    if (dbError) {
        console.error('Failed to save stitched image to DB:', dbError);
        // We continue even if DB save fails, as the file is uploaded
    }

    // Also save to 'tasks' table so it appears in "Generate Results" list
    // req.user is populated by authenticateApiKey middleware
    if ((req as any).user) {
        const userId = (req as any).user.id;
        const taskName = `API Stitch ${new Date().toLocaleString()}`;
        
        const { data: newTask, error: taskError } = await supabaseAdmin
            .from('tasks')
            .insert([
                {
                    user_id: userId,
                    name: taskName,
                    direction: direction,
                    status: 'completed',
                    export_url: publicUrl,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ])
            .select()
            .single();
        
        if (taskError) {
             console.error('Failed to create task record for API stitch:', taskError);
        } else if (newTask) {
            // Create associations in task_images table
            const taskImages = image_ids.map((imgId: string, index: number) => ({
                task_id: newTask.id,
                image_id: imgId,
                sort_order: index
            }));

            const { error: linkError } = await supabaseAdmin
                .from('task_images')
                .insert(taskImages);
            
            if (linkError) {
                console.error('Failed to link images to task:', linkError);
            }
        }
    }

    res.json({
      id: savedImage?.id, // Return ID if saved
      result_url: publicUrl,
      width: meta.width,
      height: meta.height
    });

  } catch (error: any) {
    console.error('Open API Stitch error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
