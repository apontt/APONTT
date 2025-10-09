const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rate limiting mais restritivo para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

// Configuração CORS mais segura
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? ['https://apontt.github.io'] : ['http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname), { dotfiles: 'deny' }));

// Storage para uploads (logo) com validação
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório de uploads:', err);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Tipo de arquivo não permitido'));
    }
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Banco simples: arquivo JSON (persistência leve)
const DB_FILE = path.join(__dirname, 'db.json');
let db = { partners: [], clients: [] };

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      if (!db.partners) db.partners = [];
      if (!db.clients) db.clients = [];
    } catch (e) {
      console.error('Erro ao carregar banco de dados:', e);
      db = { partners: [], clients: [] };
    }
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar banco de dados:', e);
  }
}

loadDB();

// Servidor HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, { 
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
});

// Helpers
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Validação de entrada
function validatePartner(data) {
  const { companyName, document, email, phone, responsible } = data;
  if (!companyName || companyName.length < 2) return 'Nome da empresa é obrigatório';
  if (!document || document.length < 11) return 'Documento inválido';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
  if (!phone || phone.length < 10) return 'Telefone inválido';
  if (!responsible || responsible.length < 2) return 'Responsável é obrigatório';
  return null;
}

function validateClient(data) {
  const { name, document, contractValue } = data;
  if (!name || name.length < 2) return 'Nome é obrigatório';
  if (!document || document.length < 11) return 'Documento inválido';
  if (contractValue && (isNaN(contractValue) || contractValue < 0)) return 'Valor do contrato inválido';
  return null;
}

// Rate limiting simples
const rateLimiter = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const maxRequests = 100;
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limit = rateLimiter.get(ip);
  if (now > limit.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Rotas
app.get('/api/partners', (req, res) => {
  res.json({ success: true, data: db.partners });
});

// Validações para parceiros
const partnerValidation = [
  body('companyName').isLength({ min: 2, max: 100 }).trim().escape(),
  body('document').isLength({ min: 11, max: 18 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').isLength({ min: 10, max: 15 }).trim(),
  body('responsible').isLength({ min: 2, max: 100 }).trim().escape()
];

app.post('/api/partners', partnerValidation, (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    if (!checkRateLimit(req.ip)) {
      return res.status(429).json({ success: false, message: 'Muitas requisições' });
    }

    upload.single('logo')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { companyName, document, email, phone, responsible } = req.body;
      const logo = req.file ? '/uploads/' + path.basename(req.file.filename) : null;
      
      const newPartner = {
        id: generateId(),
        companyName: companyName.trim(),
        document: document.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        responsible: responsible.trim(),
        logo,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      db.partners.push(newPartner);
      saveDB();

      io.emit('partner:created', newPartner);
      res.status(201).json({ success: true, data: newPartner });
    });
  } catch (err) {
    console.error('Erro ao criar parceiro:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
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

// Validações para clientes
const clientValidation = [
  body('name').isLength({ min: 2, max: 100 }).trim().escape(),
  body('document').isLength({ min: 11, max: 18 }).trim(),
  body('contractValue').isFloat({ min: 0, max: 1000000 })
];

app.post('/api/partners/:id/clients', clientValidation, (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    if (!checkRateLimit(req.ip)) {
      return res.status(429).json({ success: false, message: 'Muitas requisições' });
    }

    const partner = db.partners.find(p => p.id === req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
    }

    const { name, document, contractValue, status } = req.body;
    const newClient = {
      id: generateId(),
      partnerId: req.params.id,
      name: name.trim(),
      document: document.trim(),
      contractValue: parseFloat(contractValue) || 0,
      status: status || 'active',
      createdAt: new Date()
    };
    
    db.clients.push(newClient);
    saveDB();
    io.emit('client:created', newClient);
    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
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
  const filePath = path.join(__dirname, 'deepseek_html_20250909_2bf8a5.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Página não encontrada' });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor realtime rodando em http://localhost:${PORT}`);
});
