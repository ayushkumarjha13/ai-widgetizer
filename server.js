import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import widgetHandler from './api/widget/[id].js';
import trackHandler from './api/track.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Mock the Vercel request/response for the widget handler
app.get('/api/widget/:id', async (req, res) => {
  req.query = { id: req.params.id };
  await widgetHandler(req, res);
});

// 2. Mock the Vercel request/response for the track handler
app.post('/api/track', async (req, res) => {
  await trackHandler(req, res);
});

// 3. Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// 4. Fallback all other routes to index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API check: http://localhost:${PORT}/api/widget/test`);
});
