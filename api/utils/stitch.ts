import sharp from 'sharp';
import { supabaseAdmin } from '../config/supabase.js';

const BUCKET_NAME = 'pintu-images';

interface ImageItem {
  storage_path: string;
  width: number;
  height: number;
}

export async function stitchImages(images: ImageItem[], direction: 'down' | 'right'): Promise<Buffer> {
  if (images.length === 0) {
    throw new Error('No images to stitch');
  }

  // 1. 下载所有图片数据
  const imageBuffers = await Promise.all(
    images.map(async (img) => {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(img.storage_path);
      
      if (error || !data) throw new Error(`Failed to download image: ${img.storage_path}`);
      return Buffer.from(await data.arrayBuffer());
    })
  );

  // 2. 计算总画布大小
  // 为了拼接效果，通常需要统一宽度（向下拼）或高度（向右拼），或者保持原样直接拼。
  // 简单起见，我们保持原样拼接，不做缩放，除非用户有需求。
  // 需求说 "图片之间不要留缝隙"。
  // 假设所有图片宽度不一致，向下拼时，通常取最大宽度作为画布宽度，居中或左对齐。
  // 或者为了美观，先 resize 到统一宽度。
  // 既然是拼图App，通常会有"长图"模式，意味着宽度一致。
  // 我们这里实现：向下拼时，以第一张图的宽度为基准，将后续图片 resize 到相同宽度（保持比例）。
  // 向右拼时，以第一张图的高度为基准，将后续图片 resize 到相同高度。

  const firstImgMeta = await sharp(imageBuffers[0]).metadata();
  const baseWidth = firstImgMeta.width || 1080;
  const baseHeight = firstImgMeta.height || 1920;

  let totalWidth = 0;
  let totalHeight = 0;
  const processedImages: { input: Buffer; top: number; left: number }[] = [];

  if (direction === 'down') {
    totalWidth = baseWidth;
    let currentY = 0;

    for (const buffer of imageBuffers) {
      const meta = await sharp(buffer).metadata();
      // 如果获取不到宽高，给默认值防止 crash
      const w = meta.width || 100;
      const h = meta.height || 100;
      
      const currentH = Math.round((h * baseWidth) / w); // 保持比例计算高度
      
      // Resize 图片
      const resizedBuffer = await sharp(buffer).resize({ width: baseWidth }).toBuffer();
      
      processedImages.push({ input: resizedBuffer, top: currentY, left: 0 });
      currentY += currentH;
    }
    totalHeight = currentY;

  } else { // direction === 'right'
    totalHeight = baseHeight;
    let currentX = 0;

    for (const buffer of imageBuffers) {
      const meta = await sharp(buffer).metadata();
      // 如果获取不到宽高，给默认值防止 crash
      const w = meta.width || 100;
      const h = meta.height || 100;

      const currentW = Math.round((w * baseHeight) / h); // 保持比例计算宽度
      
      // Resize 图片
      const resizedBuffer = await sharp(buffer).resize({ height: baseHeight }).toBuffer();
      
      processedImages.push({ input: resizedBuffer, top: 0, left: currentX });
      currentX += currentW;
    }
    totalWidth = currentX;
  }

  // 3. 创建画布并合成
  // Sharp 限制：输出图片尺寸不能过大（默认限制好像是 16383x16383 ? 不，Sharp 基于 libvips，支持很大）
  // 但要注意内存。
  const result = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4, // 4 通道 RGBA
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(processedImages)
  .jpeg({ quality: 80, mozjpeg: true }) // 导出为 JPEG 以减小体积
  .toBuffer();

  return result;
}
