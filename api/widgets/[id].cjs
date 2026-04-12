const { query } = require('../db.cjs');
const { authenticateToken } = require('../auth.cjs');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM widgets WHERE id = ', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Widget not found' });
      res.status(200).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: 'Internal error' }); }
  } else if (req.method === 'DELETE') {
    authenticateToken(req, res, async () => {
       try {
         await query('DELETE FROM widgets WHERE id =  AND owner_uid = ', [id, req.user.user_id]);
         res.status(200).json({ success: true });
       } catch (error) { res.status(500).json({ error: 'Error deleting' }); }
    });
  }
};
