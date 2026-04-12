const { query } = require('../db');
const { authenticateToken } = require('../auth');

module.exports = async (req, res) => {
  authenticateToken(req, res, async () => {
    try {
      if (req.user.email !== 'ayushkumarjha13@gmail.com') return res.status(403).json({ error: 'Forbidden' });
      const stats = await query('SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM widgets) as widgets, (SELECT COUNT(*) FROM messages) as messages');
      res.status(200).json(stats.rows[0]);
    } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
  });
};
