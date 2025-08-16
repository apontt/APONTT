import serverless from 'serverless-http';
import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota básica
app.get('/api/*', (req, res) => {
  res.json({ message: 'APONTTPAY API funcionando!', path: req.path });
});

export const handler = serverless(app);