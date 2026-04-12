const { query } = require('../db');
const { authenticateToken } = require('../auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  authenticateToken(req, res, async () => {
    try {
      const { user_id } = req.user;
      const { widget_id } = req.query;
      let q = 'SELECT session_id, MAX(ts) as last_activity, COUNT(*) as msg_count FROM messages WHERE owner_uid = ';
      let params = [user_id];
      if (widget_id) { q += ' AND widget_id = '; params.push(widget_id); }
      q += ' GROUP BY session_id ORDER BY last_activity DESC';
      const result = await query(q, params);
      res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
  });
};
