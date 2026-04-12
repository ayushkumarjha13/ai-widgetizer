const { query } = require('../db.cjs');
const { authenticateToken } = require('../auth.cjs');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  authenticateToken(req, res, async () => {
    try {
      const { user_id } = req.user;
      const { session_id } = req.query;
      const result = await query('SELECT * FROM messages WHERE owner_uid =  AND session_id =  ORDER BY ts ASC', [user_id, session_id]);
      res.status(200).json(result.rows || []);
    } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
  });
};
