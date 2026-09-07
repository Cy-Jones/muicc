import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

router.get('/', async (req, res) => {
  const sponsors = await db.prepare('SELECT * FROM sponsors ORDER BY display_order ASC, name ASC').all();
  return res.json(sponsors);
});

router.post('/admin/save', authenticateAdmin, async (req, res) => {
  const { id, name, logo_url, tier, website, display_order } = req.body;
  if (!name || !logo_url) {
    return res.status(400).json({ error: 'Name and logo URL are required.' });
  }

  if (id) {
    await db.prepare(`
      UPDATE sponsors SET name = ?, logo_url = ?, tier = ?, website = ?, display_order = ? WHERE id = ?
    `).run(name, logo_url, tier || 'GOLD', website || null, display_order || 0, id);
    return res.json({ success: true, message: 'Sponsor updated.' });
  } else {
    const newId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO sponsors (id, name, logo_url, tier, website, display_order) VALUES (?, ?, ?, ?, ?, ?)
    `).run(newId, name, logo_url, tier || 'GOLD', website || null, display_order || 0);
    return res.json({ success: true, message: 'Sponsor added.' });
  }
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  await db.prepare('DELETE FROM sponsors WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Sponsor deleted.' });
});

export default router;
