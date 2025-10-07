const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Storage para uploads (logo)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Banco simples: arquivo JSON (persistência leve)
const DB_FILE = path.join(__dirname, 'db.json');
let db = { partners: [] };
if (fs.existsSync(DB_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { db = { partners: [] }; }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// Servidor HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
});

// Helpers
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// garantir estrutura de clients dentro do DB
if (!db.clients) db.clients = [];

// Rotas
app.get('/api/partners', (req, res) => {
  res.json({ success: true, data: db.partners });
});

app.post('/api/partners', upload.single('logo'), (req, res) => {
  try {
    const { companyName, document, email, phone, responsible } = req.body;
    const logo = req.file ? '/uploads/' + req.file.filename : null;
    const newPartner = {
      id: generateId(),
      companyName,
      document,
      email,
      phone,
      responsible,
      logo,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.partners.push(newPartner);
    saveDB();

    // Notificar em tempo real
    io.emit('partner:created', newPartner);

    res.status(201).json({ success: true, data: newPartner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

app.put('/api/partners/:id', upload.single('logo'), (req, res) => {
  try {
    const idx = db.partners.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });

    const partner = db.partners[idx];
    const { companyName, document, email, phone, responsible } = req.body;
    if (companyName) partner.companyName = companyName;
    if (document) partner.document = document;
    if (email) partner.email = email;
    if (phone) partner.phone = phone;
    if (responsible) partner.responsible = responsible;
    if (req.file) {
      // remover logo antigo
      if (partner.logo) {
        const old = path.join(__dirname, partner.logo);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      partner.logo = '/uploads/' + req.file.filename;
    }
    partner.updatedAt = new Date();
    db.partners[idx] = partner;
    saveDB();

    // Notificar em tempo real
    io.emit('partner:updated', partner);

    res.json({ success: true, data: partner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// Servir uploads
app.use('/uploads', express.static(uploadDir));

// Clients endpoints
app.get('/api/partners/:id/clients', (req, res) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
  const clients = (db.clients || []).filter(c => c.partnerId === req.params.id);
  res.json({ success: true, data: clients });
});

app.post('/api/partners/:id/clients', (req, res) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
  const { name, document, contractValue, status } = req.body;
  const newClient = {
    id: generateId(), partnerId: req.params.id, name, document, contractValue: contractValue || 0, status: status || 'active', createdAt: new Date()
  };
  db.clients.push(newClient);
  saveDB();
  io.emit('client:created', newClient);
  res.status(201).json({ success: true, data: newClient });
});

app.put('/api/clients/:id', (req, res) => {
  const idx = (db.clients || []).findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
  const client = db.clients[idx];
  const { name, document, contractValue, status } = req.body;
  if (name) client.name = name;
  if (document) client.document = document;
  if (contractValue) client.contractValue = contractValue;
  if (status) client.status = status;
  client.updatedAt = new Date();
  db.clients[idx] = client;
  saveDB();
  io.emit('client:updated', client);
  res.json({ success: true, data: client });
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'parceiros-module.html'));
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor realtime rodando em http://localhost:${PORT}`);
});
