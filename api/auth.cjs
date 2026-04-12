const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  // Simple demo login logic - in production, verify against DB
  // For this project, we are treating all logins as successful and creating/syncing the user
  
  const user = {
    user_id: email.replace(/[^a-zA-Z0-9]/g, '_'),
    email: email,
    name: email.split('@')[0]
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({
    token,
    user
  });
};
