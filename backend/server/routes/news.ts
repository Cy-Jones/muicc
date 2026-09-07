import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

router.get('/', async (req, res) => {
  const news = await db.prepare("SELECT * FROM news WHERE is_published = 1 ORDER BY publish_date DESC").all();
  return res.json(news);
});

router.get('/:slug', async (req, res) => {
  const article = await db.prepare("SELECT * FROM news WHERE slug = ? OR id = ?").get(req.params.slug, req.params.slug);
  if (!article) return res.status(404).json({ error: 'Article not found.' });
  return res.json(article);
});

router.get('/admin/all', authenticateAdmin, async (req, res) => {
  const news = await db.prepare("SELECT * FROM news ORDER BY publish_date DESC").all();
  return res.json(news);
});

router.post('/admin/save', authenticateAdmin, async (req, res) => {
  const { id, title, category, content, image_url, is_published, publish_date } = req.body;
  
  if (!title || !category || !content) {
    return res.status(400).json({ error: 'Title, category, and content are required.' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const finalImageUrl = typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;

  if (id) {
    await db.prepare(`
      UPDATE news
      SET title = ?, slug = ?, category = ?, content = ?, image_url = ?, is_published = ?, publish_date = ?
      WHERE id = ?
    `).run(title, slug, category, content, finalImageUrl, is_published ? 1 : 0, publish_date || new Date().toISOString().split('T')[0], id);
    return res.json({ success: true, message: 'News updated.' });
  } else {
    const newId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO news (id, title, slug, category, content, image_url, is_published, publish_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, title, slug, category, content, finalImageUrl, is_published ? 1 : 0, publish_date || new Date().toISOString().split('T')[0]);
    return res.json({ success: true, message: 'News created.' });
  }
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  await db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'News article deleted.' });
});

export default router;
