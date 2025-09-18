const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simulação de banco de dados em memória
let partners = [];
let contracts = [];
let payments = [];
let clients = [];
let limpaNomeProcesses = [];

// Função para gerar ID único
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Função para formatar data
const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR');

// Dados iniciais de exemplo
const initializeData = () => {
    partners = [
        {
            id: '1',
            companyName: 'Tech Solutions LTDA',
            document: '12.345.678/0001-90',
            email: 'contato@techsolutions.com.br',
            phone: '(11) 99999-9999',
            responsible: 'João Silva Santos',
            status: 'active',
            observations: 'Parceiro estratégico com foco em tecnologia',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            accessLink: '/parceiros/1'
        },
        {
            id: '2',
            companyName: 'Consultoria Empresarial ME',
            document: '98.765.432/0001-10',
            email: 'admin@consultoria.com.br',
            phone: '(21) 88888-8888',
            responsible: 'Maria Oliveira Costa',
            status: 'pending',
            observations: 'Aguardando documentação complementar',
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-02-01'),
            accessLink: '/parceiros/2'
        },
        {
            id: '3',
            companyName: 'Inovação Digital S.A.',
            document: '11.222.333/0001-44',
            email: 'parceria@inovacao.com.br',
            phone: '(31) 77777-7777',
            responsible: 'Carlos Eduardo Lima',
            status: 'active',
            observations: 'Especialista em transformação digital',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-02-10'),
            accessLink: '/parceiros/3'
        }
    ];

    contracts = [
        {
            id: 'c1',
            partnerId: '1',
            title: 'Contrato de Parceria Comercial',
            status: 'signed',
            createdAt: new Date('2024-01-16'),
            signedAt: new Date('2024-01-18'),
            value: 50000,
            stages: [
                { stage: 'draft', date: new Date('2024-01-16'), user: 'Admin', description: 'Contrato criado' },
                { stage: 'sent', date: new Date('2024-01-17'), user: 'System', description: 'Enviado para assinatura' },
                { stage: 'signed', date: new Date('2024-01-18'), user: 'João Silva', description: 'Contrato assinado' }
            ]
        },
        {
            id: 'c2',
            partnerId: '3',
            title: 'Acordo de Cooperação Técnica',
            status: 'pending_signature',
            createdAt: new Date('2024-02-05'),
            value: 75000,
            stages: [
                { stage: 'draft', date: new Date('2024-02-05'), user: 'Admin', description: 'Contrato criado' },
                { stage: 'sent', date: new Date('2024-02-06'), user: 'System', description: 'Enviado para assinatura' }
            ]
        }
    ];

    payments = [
        {
            id: 'p1',
            partnerId: '1',
            contractId: 'c1',
            type: 'repasse',
            amount: 5000,
            status: 'paid',
            dueDate: new Date('2024-02-01'),
            paidDate: new Date('2024-01-30'),
            description: 'Repasse mensal - Janeiro 2024'
        },
        {
            id: 'p2',
            partnerId: '1',
            contractId: 'c1',
            type: 'repasse',
            amount: 5500,
            status: 'pending',
            dueDate: new Date('2024-03-01'),
            description: 'Repasse mensal - Fevereiro 2024'
        },
        {
            id: 'p3',
            partnerId: '3',
            type: 'cobranca',
            amount: 1200,
            status: 'overdue',
            dueDate: new Date('2024-01-15'),
            description: 'Taxa de adesão'
        }
    ];

    clients = [
        {
            id: 'cl1',
            partnerId: '1',
            name: 'Empresa ABC LTDA',
            document: '12.345.678/0001-99',
            status: 'active',
            contractValue: 25000,
            createdAt: new Date('2024-01-20')
        },
        {
            id: 'cl2',
            partnerId: '1',
            name: 'Comércio XYZ ME',
            document: '98.765.432/0001-88',
            status: 'in_contract',
            contractValue: 15000,
            createdAt: new Date('2024-02-01')
        },
        {
            id: 'cl3',
            partnerId: '3',
            name: 'Indústria 123 S.A.',
            document: '11.111.111/0001-11',
            status: 'cancelled',
            contractValue: 0,
            createdAt: new Date('2024-01-10'),
            cancelledAt: new Date('2024-02-05')
        }
    ];

    limpaNomeProcesses = [
        {
            id: 'ln1',
            partnerId: '1',
            clientId: 'cl1',
            clientName: 'Empresa ABC LTDA',
            status: 'in_progress',
            currentStage: 'negotiation',
            createdAt: new Date('2024-02-01'),
            stages: [
                { stage: 'request_received', date: new Date('2024-02-01'), description: 'Solicitação recebida' },
                { stage: 'documents_validated', date: new Date('2024-02-02'), description: 'Documentos validados' },
                { stage: 'negotiation', date: new Date('2024-02-05'), description: 'Negociação com credor iniciada' }
            ],
            totalDebt: 45000,
            negotiatedValue: 18000
        },
        {
            id: 'ln2',
            partnerId: '3',
            clientId: 'cl3',
            clientName: 'Indústria 123 S.A.',
            status: 'completed',
            currentStage: 'finalized',
            createdAt: new Date('2024-01-15'),
            completedAt: new Date('2024-02-10'),
            stages: [
                { stage: 'request_received', date: new Date('2024-01-15'), description: 'Solicitação recebida' },
                { stage: 'documents_validated', date: new Date('2024-01-16'), description: 'Documentos validados' },
                { stage: 'negotiation', date: new Date('2024-01-20'), description: 'Negociação com credor' },
                { stage: 'agreement_issued', date: new Date('2024-02-05'), description: 'Acordo emitido' },
                { stage: 'finalized', date: new Date('2024-02-10'), description: 'Nome limpo - Processo finalizado' }
            ],
            totalDebt: 120000,
            negotiatedValue: 35000
        }
    ];
};

// Inicializar dados
initializeData();

// ROTAS PRINCIPAIS - CRUD PARCEIROS

// GET /api/partners - Listar parceiros com filtros
app.get('/api/partners', (req, res) => {
    try {
        const { search, status, type, page = 1, limit = 10 } = req.query;
        let filteredPartners = [...partners];

        // Filtro por busca (nome ou CNPJ)
        if (search) {
            const searchLower = search.toLowerCase();
            filteredPartners = filteredPartners.filter(partner => 
                partner.companyName.toLowerCase().includes(searchLower) ||
                partner.document.includes(search) ||
                partner.responsible.toLowerCase().includes(searchLower)
            );
        }

        // Filtro por status
        if (status) {
            filteredPartners = filteredPartners.filter(partner => partner.status === status);
        }

        // Filtro por tipo (PF/PJ baseado no documento)
        if (type) {
            if (type === 'pj') {
                filteredPartners = filteredPartners.filter(partner => partner.document.includes('/'));
            } else if (type === 'pf') {
                filteredPartners = filteredPartners.filter(partner => !partner.document.includes('/'));
            }
        }

        // Paginação
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedPartners = filteredPartners.slice(startIndex, endIndex);

        // Estatísticas
        const stats = {
            total: partners.length,
            active: partners.filter(p => p.status === 'active').length,
            inactive: partners.filter(p => p.status === 'inactive').length,
            pending: partners.filter(p => p.status === 'pending').length,
            monthlyRevenue: payments
                .filter(p => p.status === 'paid' && p.type === 'repasse')
                .reduce((sum, p) => sum + p.amount, 0)
        };

        res.json({
            success: true,
            data: paginatedPartners,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredPartners.length,
                pages: Math.ceil(filteredPartners.length / limit)
            },
            stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// GET /api/partners/:id - Obter parceiro específico
app.get('/api/partners/:id', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        // Buscar dados relacionados
        const partnerContracts = contracts.filter(c => c.partnerId === partner.id);
        const partnerPayments = payments.filter(p => p.partnerId === partner.id);
        const partnerClients = clients.filter(c => c.partnerId === partner.id);
        const partnerLimpaNome = limpaNomeProcesses.filter(ln => ln.partnerId === partner.id);

        res.json({
            success: true,
            data: {
                ...partner,
                contracts: partnerContracts,
                payments: partnerPayments,
                clients: partnerClients,
                limpaNomeProcesses: partnerLimpaNome
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// POST /api/partners - Criar novo parceiro
app.post('/api/partners', (req, res) => {
    try {
        const { companyName, document, email, phone, responsible, status, observations } = req.body;

        // Validações básicas
        if (!companyName || !document || !email || !phone || !responsible) {
            return res.status(400).json({ 
                success: false, 
                message: 'Campos obrigatórios: companyName, document, email, phone, responsible' 
            });
        }

        // Verificar se já existe parceiro com mesmo documento
        const existingPartner = partners.find(p => p.document === document);
        if (existingPartner) {
            return res.status(400).json({ 
                success: false, 
                message: 'Já existe um parceiro cadastrado com este CPF/CNPJ' 
            });
        }

        const newPartner = {
            id: generateId(),
            companyName,
            document,
            email,
            phone,
            responsible,
            status: status || 'pending',
            observations: observations || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            accessLink: `/parceiros/${generateId()}`
        };

        partners.push(newPartner);

        res.status(201).json({
            success: true,
            message: 'Parceiro criado com sucesso',
            data: newPartner
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// PUT /api/partners/:id - Atualizar parceiro
app.put('/api/partners/:id', (req, res) => {
    try {
        const partnerIndex = partners.findIndex(p => p.id === req.params.id);
        if (partnerIndex === -1) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const { companyName, document, email, phone, responsible, status, observations } = req.body;

        // Verificar se documento já existe em outro parceiro
        if (document && document !== partners[partnerIndex].document) {
            const existingPartner = partners.find(p => p.document === document && p.id !== req.params.id);
            if (existingPartner) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Já existe outro parceiro cadastrado com este CPF/CNPJ' 
                });
            }
        }

        // Atualizar dados
        partners[partnerIndex] = {
            ...partners[partnerIndex],
            companyName: companyName || partners[partnerIndex].companyName,
            document: document || partners[partnerIndex].document,
            email: email || partners[partnerIndex].email,
            phone: phone || partners[partnerIndex].phone,
            responsible: responsible || partners[partnerIndex].responsible,
            status: status || partners[partnerIndex].status,
            observations: observations !== undefined ? observations : partners[partnerIndex].observations,
            updatedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Parceiro atualizado com sucesso',
            data: partners[partnerIndex]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// DELETE /api/partners/:id - Exclusão lógica (soft delete)
app.delete('/api/partners/:id', (req, res) => {
    try {
        const partnerIndex = partners.findIndex(p => p.id === req.params.id);
        if (partnerIndex === -1) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        // Soft delete - marcar como inativo e adicionar flag de deletado
        partners[partnerIndex] = {
            ...partners[partnerIndex],
            status: 'inactive',
            deleted: true,
            deletedAt: new Date(),
            updatedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Parceiro removido com sucesso (exclusão lógica)',
            data: partners[partnerIndex]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// ROTAS PARA CONTRATOS

// GET /api/partners/:id/contracts - Listar contratos do parceiro
app.get('/api/partners/:id/contracts', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const partnerContracts = contracts.filter(c => c.partnerId === req.params.id);
        res.json({ success: true, data: partnerContracts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// POST /api/partners/:id/contracts - Gerar novo contrato
app.post('/api/partners/:id/contracts', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const { title, value, template } = req.body;

        const newContract = {
            id: generateId(),
            partnerId: req.params.id,
            title: title || 'Contrato de Parceria',
            status: 'draft',
            createdAt: new Date(),
            value: value || 0,
            template: template || 'standard',
            stages: [
                { 
                    stage: 'draft', 
                    date: new Date(), 
                    user: 'Admin', 
                    description: 'Contrato criado' 
                }
            ]
        };

        contracts.push(newContract);

        res.status(201).json({
            success: true,
            message: 'Contrato gerado com sucesso',
            data: newContract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// PUT /api/contracts/:id/stage - Atualizar etapa do contrato
app.put('/api/contracts/:id/stage', (req, res) => {
    try {
        const contractIndex = contracts.findIndex(c => c.id === req.params.id);
        if (contractIndex === -1) {
            return res.status(404).json({ success: false, message: 'Contrato não encontrado' });
        }

        const { stage, user, description } = req.body;

        // Adicionar nova etapa
        contracts[contractIndex].stages.push({
            stage,
            date: new Date(),
            user: user || 'System',
            description: description || `Etapa ${stage} executada`
        });

        // Atualizar status do contrato
        contracts[contractIndex].status = stage;
        if (stage === 'signed') {
            contracts[contractIndex].signedAt = new Date();
        }

        res.json({
            success: true,
            message: 'Etapa do contrato atualizada com sucesso',
            data: contracts[contractIndex]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// ROTAS PARA PAGAMENTOS

// GET /api/partners/:id/payments - Listar pagamentos do parceiro
app.get('/api/partners/:id/payments', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const partnerPayments = payments.filter(p => p.partnerId === req.params.id);
        
        // Estatísticas de pagamentos
        const stats = {
            total: partnerPayments.length,
            paid: partnerPayments.filter(p => p.status === 'paid').length,
            pending: partnerPayments.filter(p => p.status === 'pending').length,
            overdue: partnerPayments.filter(p => p.status === 'overdue').length,
            totalAmount: partnerPayments.reduce((sum, p) => sum + p.amount, 0),
            paidAmount: partnerPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
        };

        res.json({ 
            success: true, 
            data: partnerPayments,
            stats 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// POST /api/partners/:id/payments - Criar novo pagamento
app.post('/api/partners/:id/payments', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const { type, amount, dueDate, description, contractId } = req.body;

        const newPayment = {
            id: generateId(),
            partnerId: req.params.id,
            contractId: contractId || null,
            type: type || 'repasse',
            amount: amount || 0,
            status: 'pending',
            dueDate: new Date(dueDate),
            description: description || '',
            createdAt: new Date()
        };

        payments.push(newPayment);

        res.status(201).json({
            success: true,
            message: 'Pagamento criado com sucesso',
            data: newPayment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// PUT /api/payments/:id/status - Atualizar status do pagamento
app.put('/api/payments/:id/status', (req, res) => {
    try {
        const paymentIndex = payments.findIndex(p => p.id === req.params.id);
        if (paymentIndex === -1) {
            return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
        }

        const { status } = req.body;

        payments[paymentIndex].status = status;
        if (status === 'paid') {
            payments[paymentIndex].paidDate = new Date();
        }

        res.json({
            success: true,
            message: 'Status do pagamento atualizado com sucesso',
            data: payments[paymentIndex]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// ROTAS PARA CLIENTES

// GET /api/partners/:id/clients - Listar clientes do parceiro
app.get('/api/partners/:id/clients', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const partnerClients = clients.filter(c => c.partnerId === req.params.id);
        
        // Estatísticas de clientes
        const stats = {
            total: partnerClients.length,
            active: partnerClients.filter(c => c.status === 'active').length,
            inContract: partnerClients.filter(c => c.status === 'in_contract').length,
            cancelled: partnerClients.filter(c => c.status === 'cancelled').length,
            totalValue: partnerClients.reduce((sum, c) => sum + c.contractValue, 0)
        };

        res.json({ 
            success: true, 
            data: partnerClients,
            stats 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// POST /api/partners/:id/clients - Adicionar cliente ao parceiro
app.post('/api/partners/:id/clients', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const { name, document, contractValue, status } = req.body;

        const newClient = {
            id: generateId(),
            partnerId: req.params.id,
            name,
            document,
            status: status || 'active',
            contractValue: contractValue || 0,
            createdAt: new Date()
        };

        clients.push(newClient);

        res.status(201).json({
            success: true,
            message: 'Cliente adicionado com sucesso',
            data: newClient
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// ROTAS PARA LIMPA NOME

// GET /api/partners/:id/limpa-nome - Listar processos Limpa Nome do parceiro
app.get('/api/partners/:id/limpa-nome', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const partnerProcesses = limpaNomeProcesses.filter(ln => ln.partnerId === req.params.id);
        
        // Estatísticas dos processos
        const stats = {
            total: partnerProcesses.length,
            inProgress: partnerProcesses.filter(p => p.status === 'in_progress').length,
            completed: partnerProcesses.filter(p => p.status === 'completed').length,
            pending: partnerProcesses.filter(p => p.status === 'pending_documentation').length,
            totalDebt: partnerProcesses.reduce((sum, p) => sum + (p.totalDebt || 0), 0),
            totalNegotiated: partnerProcesses.reduce((sum, p) => sum + (p.negotiatedValue || 0), 0)
        };

        res.json({ 
            success: true, 
            data: partnerProcesses,
            stats 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// POST /api/partners/:id/limpa-nome - Iniciar processo Limpa Nome
app.post('/api/partners/:id/limpa-nome', (req, res) => {
    try {
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Parceiro não encontrado' });
        }

        const { clientId, clientName, totalDebt } = req.body;

        const newProcess = {
            id: generateId(),
            partnerId: req.params.id,
            clientId,
            clientName,
            status: 'in_progress',
            currentStage: 'request_received',
            createdAt: new Date(),
            totalDebt: totalDebt || 0,
            stages: [
                { 
                    stage: 'request_received', 
                    date: new Date(), 
                    description: 'Solicitação recebida' 
                }
            ]
        };

        limpaNomeProcesses.push(newProcess);

        res.status(201).json({
            success: true,
            message: 'Processo Limpa Nome iniciado com sucesso',
            data: newProcess
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// PUT /api/limpa-nome/:id/stage - Atualizar etapa do processo Limpa Nome
app.put('/api/limpa-nome/:id/stage', (req, res) => {
    try {
        const processIndex = limpaNomeProcesses.findIndex(p => p.id === req.params.id);
        if (processIndex === -1) {
            return res.status(404).json({ success: false, message: 'Processo não encontrado' });
        }

        const { stage, description, negotiatedValue } = req.body;

        // Adicionar nova etapa
        limpaNomeProcesses[processIndex].stages.push({
            stage,
            date: new Date(),
            description: description || `Etapa ${stage} executada`
        });

        // Atualizar status e etapa atual
        limpaNomeProcesses[processIndex].currentStage = stage;
        
        if (stage === 'finalized') {
            limpaNomeProcesses[processIndex].status = 'completed';
            limpaNomeProcesses[processIndex].completedAt = new Date();
        }

        if (negotiatedValue) {
            limpaNomeProcesses[processIndex].negotiatedValue = negotiatedValue;
        }

        res.json({
            success: true,
            message: 'Etapa do processo atualizada com sucesso',
            data: limpaNomeProcesses[processIndex]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// ROTAS PARA RELATÓRIOS E EXPORTAÇÃO

// GET /api/partners/export - Exportar dados dos parceiros
app.get('/api/partners/export', (req, res) => {
    try {
        const { format = 'json' } = req.query;
        
        if (format === 'csv') {
            // Gerar CSV
            const csvHeader = 'ID,Nome da Empresa,CPF/CNPJ,Email,Telefone,Responsável,Status,Data de Cadastro\n';
            const csvData = partners.map(p => 
                `${p.id},"${p.companyName}","${p.document}","${p.email}","${p.phone}","${p.responsible}","${p.status}","${formatDate(p.createdAt)}"`
            ).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=parceiros.csv');
            res.send(csvHeader + csvData);
        } else {
            // Retornar JSON
            res.json({
                success: true,
                data: partners,
                exportedAt: new Date(),
                total: partners.length
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// GET /api/dashboard/stats - Estatísticas gerais do dashboard
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const stats = {
            partners: {
                total: partners.length,
                active: partners.filter(p => p.status === 'active').length,
                inactive: partners.filter(p => p.status === 'inactive').length,
                pending: partners.filter(p => p.status === 'pending').length
            },
            contracts: {
                total: contracts.length,
                signed: contracts.filter(c => c.status === 'signed').length,
                pending: contracts.filter(c => c.status === 'pending_signature').length,
                draft: contracts.filter(c => c.status === 'draft').length
            },
            payments: {
                total: payments.length,
                paid: payments.filter(p => p.status === 'paid').length,
                pending: payments.filter(p => p.status === 'pending').length,
                overdue: payments.filter(p => p.status === 'overdue').length,
                monthlyRevenue: payments
                    .filter(p => p.status === 'paid' && p.type === 'repasse')
                    .reduce((sum, p) => sum + p.amount, 0)
            },
            clients: {
                total: clients.length,
                active: clients.filter(c => c.status === 'active').length,
                inContract: clients.filter(c => c.status === 'in_contract').length,
                cancelled: clients.filter(c => c.status === 'cancelled').length
            },
            limpaNome: {
                total: limpaNomeProcesses.length,
                inProgress: limpaNomeProcesses.filter(p => p.status === 'in_progress').length,
                completed: limpaNomeProcesses.filter(p => p.status === 'completed').length,
                pending: limpaNomeProcesses.filter(p => p.status === 'pending_documentation').length
            }
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
});

// Rota para servir o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'parceiros-module.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Rota não encontrada' 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor APONTTPAY - Gestão de Parceiros rodando na porta ${PORT}`);
    console.log(`📊 Dashboard disponível em: http://localhost:${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`\n📋 Endpoints principais:`);
    console.log(`   GET    /api/partners - Listar parceiros`);
    console.log(`   POST   /api/partners - Criar parceiro`);
    console.log(`   GET    /api/partners/:id - Obter parceiro`);
    console.log(`   PUT    /api/partners/:id - Atualizar parceiro`);
    console.log(`   DELETE /api/partners/:id - Remover parceiro`);
    console.log(`   GET    /api/partners/:id/contracts - Contratos do parceiro`);
    console.log(`   GET    /api/partners/:id/payments - Pagamentos do parceiro`);
    console.log(`   GET    /api/partners/:id/clients - Clientes do parceiro`);
    console.log(`   GET    /api/partners/:id/limpa-nome - Processos Limpa Nome`);
    console.log(`   GET    /api/dashboard/stats - Estatísticas gerais`);
});

module.exports = app;