const { query } = require('../db.cjs');
const { authenticateToken } = require('../auth.cjs');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  authenticateToken(req, res, async () => {
    try {
      const { user_id } = req.user;
      const widgets = await query('SELECT * FROM widgets WHERE owner_uid = $1 ORDER BY created_at DESC', [user_id]);
      res.status(200).json(widgets.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
