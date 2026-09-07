import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

// Ensure upload directories exist
const getUploadDirs = () => {
  const rootUploads = path.resolve(process.cwd(), '..', 'frontend', 'public', 'uploads');
  const localUploads = path.resolve(process.cwd(), 'public', 'uploads');
  
  if (!fs.existsSync(rootUploads)) {
    fs.mkdirSync(rootUploads, { recursive: true });
  }
  if (!fs.existsSync(localUploads)) {
    fs.mkdirSync(localUploads, { recursive: true });
  }
  
  return { rootUploads, localUploads };
};

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    let buffer: Buffer | null = null;
    let ext = '.jpg';
    let originalName = 'upload';

    if (req.file) {
      buffer = req.file.buffer;
      ext = path.extname(req.file.originalname) || '.jpg';
      originalName = req.file.originalname;
    } else if (req.body && req.body.image) {
      // Base64 upload fallback
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      const match = req.body.image.match(/^data:image\/(\w+);base64,/);
      if (match) {
        ext = `.${match[1]}`;
      }
    }

    if (!buffer) {
      return res.status(400).json({ error: 'No image file or base64 data provided.' });
    }

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const fileName = `img_${Date.now()}_${uniqueId}${ext}`;

    if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary in Production
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'miucc2026', public_id: `img_${Date.now()}_${uniqueId}` },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
            }
            res.json({
              success: true,
              url: result?.secure_url,
              fileName: result?.public_id,
              originalName
            });
            resolve();
          }
        );
        uploadStream.end(buffer);
      });
    }

    // Local filesystem upload
    const { rootUploads, localUploads } = getUploadDirs();

    // Write to both upload destinations
    const rootFilePath = path.join(rootUploads, fileName);
    const localFilePath = path.join(localUploads, fileName);

    fs.writeFileSync(rootFilePath, buffer);
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return res.json({
      success: true,
      url: publicUrl,
      fileName,
      originalName
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to upload image.' });
  }
});

export default router;
