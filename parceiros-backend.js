const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Inicializar banco de dados
const db = new sqlite3.Database('parceiros.db');

// Criar tabelas
db.serialize(() => {
    // Tabela de parceiros
    db.run(`CREATE TABLE IF NOT EXISTS parceiros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_empresa TEXT NOT NULL,
        cnpj TEXT UNIQUE NOT NULL,
        email_corporativo TEXT NOT NULL,
        telefone TEXT NOT NULL,
        responsavel TEXT NOT NULL,
        status TEXT DEFAULT 'Pendente' CHECK(status IN ('Ativo', 'Inativo', 'Pendente')),
        link_acesso TEXT UNIQUE,
        observacoes_internas TEXT,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
    )`);

    // Tabela de contratos
    db.run(`CREATE TABLE IF NOT EXISTS contratos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parceiro_id INTEGER NOT NULL,
        status TEXT DEFAULT 'rascunho' CHECK(status IN ('rascunho', 'enviado', 'aguardando_assinatura', 'assinado')),
        conteudo TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_assinatura DATETIME NULL,
        usuario_responsavel TEXT,
        FOREIGN KEY (parceiro_id) REFERENCES parceiros (id)
    )`);

    // Tabela de pagamentos
    db.run(`CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parceiro_id INTEGER NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        tipo TEXT CHECK(tipo IN ('repasse', 'cobranca')),
        status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'pago', 'atrasado')),
        descricao TEXT,
        data_vencimento DATE,
        data_pagamento DATE NULL,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parceiro_id) REFERENCES parceiros (id)
    )`);

    // Tabela de clientes vinculados
    db.run(`CREATE TABLE IF NOT EXISTS clientes_parceiros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parceiro_id INTEGER NOT NULL,
        nome_cliente TEXT NOT NULL,
        cpf_cnpj TEXT NOT NULL,
        status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'em_contrato', 'cancelado')),
        data_vinculacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parceiro_id) REFERENCES parceiros (id)
    )`);

    // Tabela de limpa nome
    db.run(`CREATE TABLE IF NOT EXISTS limpa_nome (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parceiro_id INTEGER NOT NULL,
        cliente_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'em_andamento', 'finalizado', 'pendente_documentacao')),
        etapa_atual TEXT DEFAULT 'solicitacao_recebida',
        valor_divida DECIMAL(10,2),
        valor_acordo DECIMAL(10,2),
        observacoes TEXT,
        data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_finalizacao DATETIME NULL,
        FOREIGN KEY (parceiro_id) REFERENCES parceiros (id),
        FOREIGN KEY (cliente_id) REFERENCES clientes_parceiros (id)
    )`);
});

// Função para gerar link único
function gerarLinkAcesso() {
    return crypto.randomBytes(16).toString('hex');
}

// ROTAS - PARCEIROS CRUD

// Listar parceiros com filtros
app.get('/api/parceiros', (req, res) => {
    const { nome, cnpj, status, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM parceiros WHERE deleted_at IS NULL';
    let params = [];

    if (nome) {
        query += ' AND nome_empresa LIKE ?';
        params.push(`%${nome}%`);
    }
    if (cnpj) {
        query += ' AND cnpj LIKE ?';
        params.push(`%${cnpj}%`);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY data_cadastro DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Contar total para paginação
        let countQuery = 'SELECT COUNT(*) as total FROM parceiros WHERE deleted_at IS NULL';
        let countParams = [];
        
        if (nome) {
            countQuery += ' AND nome_empresa LIKE ?';
            countParams.push(`%${nome}%`);
        }
        if (cnpj) {
            countQuery += ' AND cnpj LIKE ?';
            countParams.push(`%${cnpj}%`);
        }
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                parceiros: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Obter parceiro por ID
app.get('/api/parceiros/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM parceiros WHERE id = ? AND deleted_at IS NULL', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Parceiro não encontrado' });
        }
        res.json(row);
    });
});

// Criar novo parceiro
app.post('/api/parceiros', (req, res) => {
    const {
        nome_empresa,
        cnpj,
        email_corporativo,
        telefone,
        responsavel,
        status = 'Pendente',
        observacoes_internas
    } = req.body;

    const link_acesso = gerarLinkAcesso();

    const query = `INSERT INTO parceiros 
        (nome_empresa, cnpj, email_corporativo, telefone, responsavel, status, link_acesso, observacoes_internas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [nome_empresa, cnpj, email_corporativo, telefone, responsavel, status, link_acesso, observacoes_internas], 
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID,
                link_acesso: `/parceiros/${link_acesso}`,
                message: 'Parceiro criado com sucesso'
            });
        });
});

// Atualizar parceiro
app.put('/api/parceiros/:id', (req, res) => {
    const { id } = req.params;
    const {
        nome_empresa,
        cnpj,
        email_corporativo,
        telefone,
        responsavel,
        status,
        observacoes_internas
    } = req.body;

    const query = `UPDATE parceiros SET 
        nome_empresa = ?, cnpj = ?, email_corporativo = ?, telefone = ?, 
        responsavel = ?, status = ?, observacoes_internas = ?, data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL`;

    db.run(query, [nome_empresa, cnpj, email_corporativo, telefone, responsavel, status, observacoes_internas, id], 
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Parceiro não encontrado' });
            }
            res.json({ message: 'Parceiro atualizado com sucesso' });
        });
});

// Deletar parceiro (soft delete)
app.delete('/api/parceiros/:id', (req, res) => {
    const { id } = req.params;

    db.run('UPDATE parceiros SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Parceiro não encontrado' });
            }
            res.json({ message: 'Parceiro excluído com sucesso' });
        });
});

// ROTAS - CONTRATOS

// Listar contratos do parceiro
app.get('/api/parceiros/:id/contratos', (req, res) => {
    const { id } = req.params;
    
    db.all('SELECT * FROM contratos WHERE parceiro_id = ? ORDER BY data_criacao DESC', [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Criar novo contrato
app.post('/api/parceiros/:id/contratos', (req, res) => {
    const { id } = req.params;
    const { conteudo, usuario_responsavel } = req.body;

    const query = 'INSERT INTO contratos (parceiro_id, conteudo, usuario_responsavel) VALUES (?, ?, ?)';
    
    db.run(query, [id, conteudo, usuario_responsavel], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Contrato criado com sucesso'
        });
    });
});

// Atualizar status do contrato
app.put('/api/contratos/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, usuario_responsavel } = req.body;

    let query = 'UPDATE contratos SET status = ?, usuario_responsavel = ?';
    let params = [status, usuario_responsavel];

    if (status === 'assinado') {
        query += ', data_assinatura = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Status do contrato atualizado' });
    });
});

// ROTAS - PAGAMENTOS

// Listar pagamentos do parceiro
app.get('/api/parceiros/:id/pagamentos', (req, res) => {
    const { id } = req.params;
    
    db.all('SELECT * FROM pagamentos WHERE parceiro_id = ? ORDER BY data_criacao DESC', [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Criar pagamento
app.post('/api/parceiros/:id/pagamentos', (req, res) => {
    const { id } = req.params;
    const { valor, tipo, descricao, data_vencimento } = req.body;

    const query = 'INSERT INTO pagamentos (parceiro_id, valor, tipo, descricao, data_vencimento) VALUES (?, ?, ?, ?, ?)';
    
    db.run(query, [id, valor, tipo, descricao, data_vencimento], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Pagamento registrado com sucesso'
        });
    });
});

// ROTAS - CLIENTES

// Listar clientes do parceiro
app.get('/api/parceiros/:id/clientes', (req, res) => {
    const { id } = req.params;
    
    db.all('SELECT * FROM clientes_parceiros WHERE parceiro_id = ? ORDER BY data_vinculacao DESC', [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Adicionar cliente ao parceiro
app.post('/api/parceiros/:id/clientes', (req, res) => {
    const { id } = req.params;
    const { nome_cliente, cpf_cnpj, status = 'ativo' } = req.body;

    const query = 'INSERT INTO clientes_parceiros (parceiro_id, nome_cliente, cpf_cnpj, status) VALUES (?, ?, ?, ?)';
    
    db.run(query, [id, nome_cliente, cpf_cnpj, status], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Cliente vinculado com sucesso'
        });
    });
});

// ROTAS - LIMPA NOME

// Listar processos limpa nome do parceiro
app.get('/api/parceiros/:id/limpa-nome', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT ln.*, cp.nome_cliente, cp.cpf_cnpj 
        FROM limpa_nome ln
        JOIN clientes_parceiros cp ON ln.cliente_id = cp.id
        WHERE ln.parceiro_id = ?
        ORDER BY ln.data_solicitacao DESC
    `;
    
    db.all(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Criar processo limpa nome
app.post('/api/parceiros/:id/limpa-nome', (req, res) => {
    const { id } = req.params;
    const { cliente_id, valor_divida, observacoes } = req.body;

    const query = 'INSERT INTO limpa_nome (parceiro_id, cliente_id, valor_divida, observacoes) VALUES (?, ?, ?, ?)';
    
    db.run(query, [id, cliente_id, valor_divida, observacoes], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Processo Limpa Nome iniciado com sucesso'
        });
    });
});

// Atualizar etapa do limpa nome
app.put('/api/limpa-nome/:id/etapa', (req, res) => {
    const { id } = req.params;
    const { etapa_atual, status, valor_acordo, observacoes } = req.body;

    let query = 'UPDATE limpa_nome SET etapa_atual = ?, status = ?, observacoes = ?';
    let params = [etapa_atual, status, observacoes];

    if (valor_acordo) {
        query += ', valor_acordo = ?';
        params.push(valor_acordo);
    }

    if (status === 'finalizado') {
        query += ', data_finalizacao = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Etapa atualizada com sucesso' });
    });
});

// ROTAS - RELATÓRIOS

// Relatório geral de parceiros
app.get('/api/relatorios/parceiros', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_parceiros,
            COUNT(CASE WHEN status = 'Ativo' THEN 1 END) as ativos,
            COUNT(CASE WHEN status = 'Inativo' THEN 1 END) as inativos,
            COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pendentes
        FROM parceiros 
        WHERE deleted_at IS NULL
    `;
    
    db.get(query, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Exportar dados (CSV)
app.get('/api/parceiros/export', (req, res) => {
    const query = 'SELECT * FROM parceiros WHERE deleted_at IS NULL ORDER BY data_cadastro DESC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Converter para CSV
        const headers = Object.keys(rows[0] || {});
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=parceiros.csv');
        res.send(csvContent);
    });
});

// Servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'parceiros-module.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Módulo de Parceiros disponível em http://localhost:${PORT}`);
});

module.exports = app;