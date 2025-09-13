require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Message = require('./models/Message');
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>{})
  .catch(()=>{});
app.post('/register', async (req, res)=>{
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'invalid' });
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: 'exists' });
  const hash = await bcrypt.hash(password, 10);
  const u = await User.create({ username, passwordHash: hash });
  const token = jwt.sign({ id: u._id, username: u.username }, process.env.JWT_SECRET);
  res.json({ token, username: u.username });
});
app.post('/login', async (req, res)=>{
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'invalid' });
  const u = await User.findOne({ username });
  if (!u) return res.status(400).json({ error: 'no_user' });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(400).json({ error: 'invalid' });
  const token = jwt.sign({ id: u._id, username: u.username }, process.env.JWT_SECRET);
  res.json({ token, username: u.username });
});
app.get('/messages', async (req, res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauth' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'unauth' });
  }
  const msgs = await Message.find().sort({ createdAt: 1 }).limit(200);
  res.json(msgs);
});
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Map();
wss.on('connection', async (ws, req)=>{
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token) { ws.close(); return; }
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch (e) { ws.close(); return; }
  const username = payload.username;
  clients.set(ws, username);
  const rawJoin = JSON.stringify({ type: 'presence', data: { username, action: 'joined' } });
  wss.clients.forEach(c=>{ if (c.readyState === WebSocket.OPEN) c.send(rawJoin); });
  ws.on('message', async (raw)=>{
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (msg.type === 'message') {
      const content = msg.data && msg.data.content ? String(msg.data.content) : '';
      if (!content.trim()) return;
      const m = await Message.create({ username, content });
      const out = JSON.stringify({ type: 'message', data: { _id: m._id, username: m.username, content: m.content, createdAt: m.createdAt } });
      wss.clients.forEach(c=>{ if (c.readyState === WebSocket.OPEN) c.send(out); });
    }
    if (msg.type === 'typing') {
      const out = JSON.stringify({ type: 'typing', data: { username, typing: !!msg.data.typing } });
      wss.clients.forEach(c=>{ if (c.readyState === WebSocket.OPEN) c.send(out); });
    }
  });
  ws.on('close', ()=>{
    clients.delete(ws);
    const rawLeft = JSON.stringify({ type: 'presence', data: { username, action: 'left' } });
    wss.clients.forEach(c=>{ if (c.readyState === WebSocket.OPEN) c.send(rawLeft); });
  });
});
server.listen(PORT);
