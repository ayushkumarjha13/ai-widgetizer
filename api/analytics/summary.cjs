const { query } = require('../db.cjs');
const { authenticateToken } = require('../auth.cjs');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  authenticateToken(req, res, async () => {
    try {
      const { user_id } = req.user;
      const stats = await query(`
        SELECT 
          (SELECT COUNT(*) FROM widgets WHERE owner_uid = $1) as total_widgets,
          (SELECT COUNT(*) FROM messages WHERE owner_uid = $1) as total_messages,
          (SELECT COUNT(DISTINCT session_id) FROM messages WHERE owner_uid = $1) as total_sessions,
          (SELECT COUNT(*) FROM analytics WHERE owner_uid = $1 AND event_type = 'view') as total_views
      `, [user_id]);
      res.status(200).json(stats.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
