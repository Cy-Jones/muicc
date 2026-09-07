import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

router.get('/', async (req, res) => {
  const items = await db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
  return res.json(items);
});

router.post('/admin/save', authenticateAdmin, async (req, res) => {
  const { title, image_url, media_type, album_name, caption } = req.body;
  if (!title || !image_url) {
    return res.status(400).json({ error: 'Title and media URL are required.' });
  }

  const id = crypto.randomUUID();
  const type = media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE';

  await db.prepare(`
    INSERT INTO gallery (id, title, image_url, media_type, album_name, caption)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, image_url, type, album_name || 'General', caption || '');

  return res.status(201).json({ success: true, message: `${type === 'VIDEO' ? 'Video' : 'Photo'} added to gallery.` });
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  await db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Image deleted from gallery.' });
});

export default router;
