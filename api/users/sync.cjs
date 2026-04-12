const { query } = require('../db.cjs');
const { authenticateToken } = require('../auth.cjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  authenticateToken(req, res, async () => {
    try {
      const { user_id, email, name } = req.user;
      await query('INSERT INTO users (uid, email, display_name) VALUES (, , ) ON CONFLICT (uid) DO UPDATE SET email = , display_name = ', [user_id, email, name]);
      res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
  });
};
