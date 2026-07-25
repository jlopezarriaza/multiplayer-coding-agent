import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './websocketHandler.js';
import { fileSystemStore } from './fileSystemStore.js';
import { githubService } from './githubService.js';
import { agentEngine, AVAILABLE_AGENTS } from './agentEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

new WebSocketHandler(wss);

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/files', (req, res) => {
  res.json({
    tree: fileSystemStore.getTree(),
    allFiles: fileSystemStore.getAllFiles()
  });
});

app.get('/api/repos', (req, res) => {
  res.json({ repos: githubService.getRepos() });
});

app.get('/api/agents', (req, res) => {
  res.json({ agents: AVAILABLE_AGENTS });
});

app.post('/api/config/apikey', (req, res) => {
  const { apiKey } = req.body;
  if (typeof apiKey === 'string') {
    agentEngine.setApiKey(apiKey);
    return res.json({ success: true, hasApiKey: !!apiKey });
  }
  res.status(400).json({ error: 'Invalid API key format' });
});

// Serve static built frontend files in production/standalone mode
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.send(`<h1>Agenty Server Active</h1><p>Run <code>npm run dev</code> for hot-reloading development.</p>`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`⚡ Multiplayer Agent Server listening on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server active at ws://localhost:${PORT}/ws`);
});
