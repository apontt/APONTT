const serverless = require('serverless-http');
const express = require('express');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/*', (req, res) => {
  res.json({ message: 'API OK', path: req.path });
});

exports.handler = serverless(app);