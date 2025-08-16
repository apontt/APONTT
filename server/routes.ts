import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { sanitizeForLog, sanitizeForHTML, isValidEmail } from "./utils/sanitize";
import { csrfProtection } from "./middleware/csrf";
import * as crypto from "crypto";
import { 
  insertPartnerSchema, 
  insertContractSchema, 
  insertCustomerSchema, 
  insertOpportunitySchema,
  insertRatingSchema 
} from "@shared/schema-sqlite";
import { storage } from "./storage";

import { generateFinancialInsights, generateBusinessRecommendations, type FinancialData } from "./ai-insights";
import { asaasService } from "./asaas-service";
import { testAsaasConnection } from "./test-asaas";
import { paymentServiceSimple } from "./payment-service-simple";

export async function registerRoutes(app: Express): Promise<void> {
  // Partners routes
  app.get("/api/partners", async (_req, res) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar parceiros" });
    }
  });

  app.get("/api/partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partner = await storage.getPartner(id);
      if (!partner) {
        return res.status(404).json({ message: "Parceiro não encontrado" });
      }
      res.json(partner);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar parceiro" });
    }
  });

  app.post("/api/partners", csrfProtection, async (req, res) => {
    try {
      // Gerar credenciais automaticamente
      const generateLogin = (name: string) => {
        return name.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "");
      };

      const generatePassword = () => {
        return crypto.randomBytes(12).toString('base64').slice(0, 12);
      };

      const login = generateLogin(req.body.name);
      const password = generatePassword();

      const partnerData = {
        ...req.body,
        login: login,
        password: password,
        status: req.body.status || "active"
      };

      const validatedData = insertPartnerSchema.parse(partnerData);
      const partner = await storage.createPartner(validatedData);



      res.status(201).json({
        ...partner,
        generatedCredentials: {
          login: login,
          password: password
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar parceiro" });
    }
  });

  app.put("/api/partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertPartnerSchema.partial().parse(req.body);
      const partner = await storage.updatePartner(id, updateData);
      if (!partner) {
        return res.status(404).json({ message: "Parceiro não encontrado" });
      }
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar parceiro" });
    }
  });

  app.delete("/api/partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePartner(id);
      if (!deleted) {
        return res.status(404).json({ message: "Parceiro não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar parceiro" });
    }
  });

  // Validação de login de parceiros
  app.post("/api/partners/validate-login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.json({ 
          valid: false, 
          message: "Email e senha são obrigatórios" 
        });
      }

      // Buscar parceiro pelo email
      const partners = await storage.getPartners();
      const partner = partners.find(p => p.email.toLowerCase() === email.toLowerCase());

      if (!partner) {
        return res.json({ 
          valid: false, 
          message: "Parceiro não encontrado com este email" 
        });
      }

      // Verificar se tem acesso habilitado
      if (!partner.accessEnabled) {
        return res.json({ 
          valid: false, 
          message: "Acesso não autorizado. Entre em contato com o administrador." 
        });
      }

      // Validar email
      if (!isValidEmail(email)) {
        return res.json({ 
          valid: false, 
          message: "Email inválido" 
        });
      }

      // Sistema de senhas: padrão + customizada
      const defaultPassword = email.split('@')[0] + "123";
      const customPasswordKey = `partner_password_${partner.id}`;

      // Verificar se existe senha customizada armazenada
      const customPassword = process.env[customPasswordKey] || null;

      const validPasswords = [defaultPassword];
      if (customPassword) {
        validPasswords.push(customPassword);
      }

      // Verificar senha usando timing-safe comparison
      let isValidPassword = false;
      for (const validPassword of validPasswords) {
        const passwordBuffer = Buffer.from(password, 'utf8');
        const validPasswordBuffer = Buffer.from(validPassword, 'utf8');
        if (passwordBuffer.length === validPasswordBuffer.length && 
            crypto.timingSafeEqual(passwordBuffer, validPasswordBuffer)) {
          isValidPassword = true;
          break;
        }
      }
      
      if (isValidPassword) {
        // Registrar atividade de login (sanitizado)
        await storage.createActivity({
          type: 'partner_login',
          description: `Parceiro ${sanitizeForLog(partner.name)} fez login no sistema`,
          relatedId: partner.id,
        });

        return res.json({ 
          valid: true, 
          message: "Login autorizado",
          partner: partner
        });
      } else {
        return res.json({ 
          valid: false, 
          message: `Senha incorreta. Use sua senha padrão: ${defaultPassword} ou sua senha personalizada` 
        });
      }

    } catch (error) {
      console.error('Erro na validação de login:', error);
      res.status(500).json({ 
        valid: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Rota para atualizar taxa administrativa do parceiro
  app.patch("/api/partners/:id/admin-fee", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminFeeRate } = req.body;

      if (!adminFeeRate) {
        return res.status(400).json({ message: "Taxa administrativa é obrigatória" });
      }

      const rate = parseFloat(adminFeeRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({ message: "Taxa deve ser entre 0 e 100%" });
      }

      const partner = await storage.getPartner(id);
      if (!partner) {
        return res.status(404).json({ message: "Parceiro não encontrado" });
      }

      const updatedPartner = await storage.updatePartner(id, {
        adminFeeRate: adminFeeRate
      } as any);

      await storage.createActivity({
        type: "partner_updated",
        description: `Taxa administrativa do parceiro ${partner.name} atualizada para ${adminFeeRate}%`,
        relatedId: id,
      });

      res.json(updatedPartner);
    } catch (error) {
      console.error("Erro ao atualizar taxa administrativa:", error);
      res.status(500).json({ message: "Erro ao atualizar taxa administrativa" });
    }
  });

  // Rota para gerar credenciais e token de dashboard para parceiro
  app.post("/api/partners/:id/generate-dashboard-token", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partner = await storage.getPartner(id);

      if (!partner) {
        return res.status(404).json({ message: "Parceiro não encontrado" });
      }

      // Gerar token e habilitar acesso
      const token = await storage.generatePartnerDashboardToken(id);
      await storage.updatePartnerAccess(id, true);

      // Gerar senha padrão baseada no email
      const defaultPassword = partner.email.split('@')[0] + "123";

      res.json({
        success: true,
        name: partner.name,
        email: partner.email,
        whatsapp: partner.whatsapp,
        password: defaultPassword,
        token: token,
        loginUrl: `${req.protocol}://${req.get('host')}/partner-login`
      });

    } catch (error) {
      console.error("Erro ao gerar credenciais:", error);
      res.status(500).json({ message: "Erro ao gerar credenciais" });
    }
  });

  // Rota para atualizar acesso do parceiro
  app.patch("/api/partners/:id/access", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { enabled } = req.body;

      const partner = await storage.updatePartnerAccess(id, enabled);
      if (!partner) {
        return res.status(404).json({ message: "Parceiro não encontrado" });
      }

      // Registrar atividade
      await storage.createActivity({
        type: enabled ? 'partner_access_enabled' : 'partner_access_disabled',
        description: `Acesso do parceiro ${partner.name} foi ${enabled ? 'liberado' : 'bloqueado'}`,
        relatedId: partner.id,
      });

      res.json({ success: true, partner });
    } catch (error) {
      console.error("Erro ao atualizar acesso:", error);
      res.status(500).json({ message: "Erro ao atualizar acesso" });
    }
  });

  // Rota pública para buscar dados do parceiro por token
  app.get("/api/public/partner/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      // Buscar parceiro pelo token
      const partner = await storage.getPartnerByToken(token);

      if (!partner) {
        return res.status(404).json({ message: "Parceiro não encontrado com este token" });
      }

      // Verificar se o acesso está habilitado
      if (!partner.accessEnabled) {
        return res.status(403).json({ message: "Acesso não autorizado" });
      }

      // Registrar acesso
      await storage.logPartnerAccess(partner.id);

      // Buscar dados relacionados do parceiro (contratos, clientes, etc.)
      const contracts = await storage.getContracts();
      const customers = await storage.getCustomers();

      // Filtrar apenas dados do parceiro
      const partnerContracts = contracts.filter(c => c.partnerId === partner.id);
      const partnerCustomers = customers.filter(c => c.partnerId === partner.id);

      res.json({
        partner,
        contracts: partnerContracts,
        customers: partnerCustomers,
        stats: {
          totalContracts: partnerContracts.length,
          totalCustomers: partnerCustomers.length,
          totalSales: parseFloat(partner.totalSales || '0'),
          totalCommissions: parseFloat(partner.totalCommissions || '0')
        }
      });

    } catch (error) {
      console.error("Erro ao buscar dados do parceiro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Contracts routes
  app.get("/api/contracts", async (_req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar contratos" });
    }
  });

  app.post("/api/contracts", csrfProtection, async (req, res) => {
    try {
      const contractData = insertContractSchema.parse(req.body);

      // Converter valor para formato numérico correto (usar ponto como separador decimal)
      if (contractData.value && typeof contractData.value === 'string') {
        contractData.value = contractData.value.replace(',', '.');
      }

      // Calcular taxa administrativa se um parceiro está associado
      let adminFee = null;

      if (contractData.partnerId) {
        const partner = await storage.getPartner(contractData.partnerId);
        if (partner) {
          const contractValue = parseFloat(contractData.value.toString());
          const adminFeeRate = parseFloat(partner.adminFeeRate || "5.00");

          adminFee = (contractValue * adminFeeRate) / 100;
        }
      }

      const contract = await storage.createContract(contractData);

      // Gerar link de assinatura automaticamente
      const linkToken = `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expirationDate = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 horas
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const signatureLink = `${baseUrl}/sign/${linkToken}`;

      const updatedContract = await storage.updateContract(contract.id, {
        linkToken,
        signatureLink,
        linkExpiresAt: expirationDate,
        status: "awaiting_signature",
      } as any);

      // Registrar atividade com informação da taxa administrativa
      let activityDescription = `Contrato ${contract.id} criado com link de assinatura`;
      if (adminFee) {
        activityDescription += ` - Taxa administrativa: R$ ${adminFee.toFixed(2)}`;
      }

      await storage.createActivity({
        type: "contract_created",
        description: activityDescription,
        relatedId: contract.id,
        value: adminFee?.toString(),
      });



      res.status(201).json({
        ...updatedContract,
        signatureLink,
        expiresAt: expirationDate.toISOString()
      });
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar contrato" });
    }
  });

  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(id, updateData);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar contrato" });
    }
  });

  // Rota para excluir contrato
  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContract(id);
      res.json({ success: true, message: "Contrato excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir contrato" });
    }
  });

  // Rotas para Termos de Autorização
  app.get("/api/authorization-terms", async (req, res) => {
    try {
      const terms = await storage.getAuthorizationTerms();
      res.json(terms);
    } catch (error) {
      console.error('Erro ao buscar termos de autorização:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/authorization-terms", csrfProtection, async (req, res) => {
    try {
      const termData = req.body;

      // Gerar token único para o link de assinatura
      const token = `at_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72 horas para expirar

      const termWithLink = {
        ...termData,
        linkToken: token,
        linkExpiresAt: expiresAt,
        signatureLink: `${req.protocol}://${req.get('host')}/sign-term/${token}`,
        status: "awaiting_signature"
      };

      const newTerm = await storage.createAuthorizationTerm(termWithLink);

      // Registrar atividade
      await storage.createActivity({
        type: "authorization_term_created",
        description: `Termo de autorização criado para ${termData.clientName}`,
        relatedId: newTerm.id,
      });

      res.status(201).json(newTerm);
    } catch (error) {
      console.error('Erro ao criar termo de autorização:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota para atualizar valor do contrato
  app.put("/api/contracts/:id/value", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { value } = req.body;

      if (!value || isNaN(parseFloat(value))) {
        return res.status(400).json({ message: "Valor inválido" });
      }

      const contract = await storage.updateContract(id, { value: value.toString() });
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      await storage.createActivity({
        type: "contract_updated",
        description: `Valor do contrato ${id} atualizado para R$ ${value}`,
        relatedId: id,
      });

      res.json({ success: true, contract });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar valor do contrato" });
    }
  });

  // Rota para gerar pagamento PIX
  app.post("/api/contracts/:id/generate-payment", csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getContract(parseInt(id));

      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      // Primeiro criar cliente se necessário
      const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': process.env.ASAAS_API_KEY || ''
        } as HeadersInit,
        body: JSON.stringify({
          name: contract.clientName,
          email: contract.clientEmail,
          phone: contract.clientPhone,
          cpfCnpj: contract.clientDocument,
        })
      });

      let customerId = '';
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customerId = customerData.id;
      } else {
        const errorData = await customerResponse.json();
        // Se o cliente já existe, extrair o ID do erro
        if (errorData.errors?.[0]?.description?.includes('já cadastrado')) {
          const existingCustomerResponse = await fetch(`https://www.asaas.com/api/v3/customers?email=${contract.clientEmail}`, {
            headers: {
              'access_token': process.env.ASAAS_API_KEY || ''
            } as HeadersInit
          });
          if (existingCustomerResponse.ok) {
            const existingData = await existingCustomerResponse.json();
            customerId = existingData.data?.[0]?.id || '';
          }
        }
      }

      if (!customerId) {
        throw new Error('Não foi possível criar ou encontrar o cliente no Asaas');
      }

      // Criar cobrança no Asaas
      const response = await fetch('https://www.asaas.com/api/v3/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': process.env.ASAAS_API_KEY || ''
        } as HeadersInit,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: parseFloat(contract.value.toString()),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
          description: `Pagamento do contrato: ${contract.description || 'Contrato'}`,
          externalReference: `contract_${contract.id}`,
        })
      });

      const paymentData = await response.json();

      if (!response.ok) {
        console.error('Erro da API Asaas:', paymentData);
        throw new Error(paymentData.errors?.[0]?.description || paymentData.message || 'Erro ao gerar pagamento');
      }

      // Gerar QR Code PIX se disponível
      let pixQrCode = null;
      if (paymentData.id) {
        const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentData.id}/pixQrCode`, {
          headers: {
            'access_token': process.env.ASAAS_API_KEY || ''
          } as HeadersInit
        });

        if (pixResponse.ok) {
          pixQrCode = await pixResponse.json();
        }
      }

      res.json({
        success: true,
        payment: paymentData,
        pixCode: pixQrCode?.payload,
        pixQrCodeImage: pixQrCode?.encodedImage,
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl
      });
    } catch (error) {
      console.error("Error generating payment:", error);
      res.status(500).json({ message: (error as Error).message || "Erro ao gerar pagamento PIX" });
    }
  });

  // Customers routes
  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      const partners = await storage.getPartners();

      // Adicionar informações do parceiro a cada cliente
      const customersWithPartner = customers.map(customer => {
        const partner = partners.find(p => p.id === customer.partnerId);
        return {
          ...customer,
          partnerName: partner?.name || null,
          partnerEmail: partner?.email || null
        };
      });

      res.json(customersWithPartner);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  app.post("/api/customers", csrfProtection, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);



      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, updateData);
      if (!customer) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Verificar se o cliente existe
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await storage.deleteCustomer(id);

      // Registrar atividade
      await storage.createActivity({
        type: 'customer_deleted',
        description: `Cliente "${customer.name}" foi excluído`,
        relatedId: id,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  });

  // Opportunities routes
  app.get("/api/opportunities", async (_req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar oportunidades" });
    }
  });

  app.post("/api/opportunities", csrfProtection, async (req, res) => {
    try {
      const opportunityData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(opportunityData);
      res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar oportunidade" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atividades" });
    }
  });

  // Metrics routes
  app.get("/api/metrics", async (_req, res) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas" });
    }
  });



  // Rotas públicas para assinatura de contratos
  app.get("/api/public/contract/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: "Token é obrigatório" });
      }

      // Buscar contrato pelo token
      const contracts = await storage.getContracts();
      const contract = contracts.find(c => c.linkToken === token);

      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado ou token inválido" });
      }

      // Verificar se o link não expirou
      if (contract.linkExpiresAt && new Date() > new Date(contract.linkExpiresAt)) {
        return res.status(410).json({ error: "Link de assinatura expirado" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Erro ao buscar contrato para assinatura:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/public/contract/:token/sign-authorization", async (req, res) => {
    try {
      const { token } = req.params;
      const { signature, clientName } = req.body;

      if (!token || !signature || !clientName) {
        return res.status(400).json({ error: "Token, assinatura e nome são obrigatórios" });      }

      // Buscar contrato pelo token
      const contracts = await storage.getContracts();
      const contract = contracts.find(c => c.linkToken === token);

      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }

      // Verificar se o link não expirou
      if (contract.linkExpiresAt && new Date() > new Date(contract.linkExpiresAt)) {
        return res.status(410).json({ error: "Link de assinatura expirado" });
      }

      // Atualizar contrato com assinatura do termo de autorização
      const updatedContract = await storage.updateContract(contract.id, {
        authorizationTermSigned: true,
        authorizationSignature: signature,
        authorizationSignedAt: new Date(),
        clientName: clientName
      } as any);

      await storage.createActivity({
        type: "authorization_signed",
        description: `Termo de autorização assinado por ${clientName}`,
        relatedId: contract.id,
      });

      res.json({ success: true, message: "Termo de autorização assinado com sucesso" });
    } catch (error) {
      console.error("Erro ao assinar termo de autorização:", error);
      res.status(500).json({ error: "Erro ao assinar termo de autorização" });
    }
  });

  app.post("/api/public/contract/:token/sign", async (req, res) => {
    try {
      const { token } = req.params;
      const { signature, clientName } = req.body;

      if (!token || !signature || !clientName) {
        return res.status(400).json({ error: "Token, assinatura e nome são obrigatórios" });
      }

      // Buscar contrato pelo token
      const contracts = await storage.getContracts();
      const contract = contracts.find(c => c.linkToken === token);

      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }

      // Verificar se o link não expirou
      if (contract.linkExpiresAt && new Date() > new Date(contract.linkExpiresAt)) {
        return res.status(410).json({ error: "Link de assinatura expirado" });
      }

      // Verificar se o termo de autorização foi assinado
      if (!contract.authorizationTermSigned) {
        return res.status(400).json({ error: "É necessário assinar o termo de autorização primeiro" });
      }

      // Atualizar contrato com assinatura
      const updatedContract = await storage.updateContract(contract.id, {
        status: "signed",
        clientSignature: signature,
        signedAt: new Date(),
        clientName: clientName
      } as any);

      await storage.createActivity({
        type: "contract_signed",
        description: `Contrato assinado por ${clientName}`,
        relatedId: contract.id,
      });



      // Gerar automaticamente o pagamento PIX após assinatura
      let paymentUrl = null;
      let pixQrCode = null;

      try {
        const paymentData = {
          billingType: 'PIX' as const,
          value: contract.value,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
          description: `Pagamento do contrato ${contract.type}`,
          customerName: contract.clientName,
          customerEmail: contract.clientEmail,
          customerPhone: contract.clientPhone || undefined,
          customerDocument: contract.clientDocument || undefined,
          contractId: contract.id
        };
        
        const paymentResult = await paymentServiceSimple.createPayment(paymentData);
        paymentUrl = paymentResult.paymentLink;
        pixQrCode = paymentResult.pixCode;
      } catch (paymentError) {
        console.error("Erro ao gerar pagamento automático:", paymentError);
        // Não falhar a assinatura por erro no pagamento
      }

      res.json({ 
        success: true, 
        message: "Contrato assinado com sucesso",
        paymentUrl: paymentUrl,
        pixQrCode: pixQrCode,
        contract: updatedContract
      });
    } catch (error) {
      console.error("Erro ao assinar contrato:", error);
      res.status(500).json({ error: "Erro ao assinar contrato" });
    }
  });

  // Wallet/Payment routes
  app.get("/api/wallet/payments", async (_req, res) => {
    try {
      // Buscar cobranças do banco de dados
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Erro ao buscar cobranças:", error);
      res.status(500).json({ message: "Erro ao buscar cobranças" });
    }
  });

  // Rota para excluir pagamento
  app.delete("/api/wallet/payments/:id", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      await storage.deletePayment(paymentId);
      
      await storage.createActivity({
        type: "payment_deleted",
        description: `Cobrança ${paymentId} excluída do sistema`,
        relatedId: paymentId,
      });

      res.json({ success: true, message: "Cobrança excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir cobrança:", error);
      res.status(500).json({ message: "Erro ao excluir cobrança" });
    }
  });

  // Rota para gerar pagamento de contrato específico
  app.post("/api/contracts/:id/generate-payment-pix", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato não encontrado' });
      }

      if (contract.status !== 'signed') {
        return res.status(400).json({ message: 'Contrato deve estar assinado para gerar pagamento' });
      }

      // Usar o serviço de pagamento simplificado para criar cobrança
      const result = await paymentServiceSimple.createPayment({
        billingType: 'PIX',
        value: contract.value.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        description: `Pagamento do contrato ${contract.type} - ${contract.description || 'Serviços Apontt'}`,
        customerName: contract.clientName,
        customerEmail: contract.clientEmail,
        customerPhone: contract.clientPhone || '',
        customerDocument: contract.clientDocument || '00000000000',
        contractId: contract.id
      });

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.asaasId,
          pixCode: result.pixCode,
          pixQrCodeImage: result.qrCodeImage,
          invoiceUrl: result.invoiceUrl,
          bankSlipUrl: result.bankSlipUrl,
          paymentUrl: result.invoiceUrl, // Link principal para pagamento
          value: contract.value,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          simulationMode: result.isSimulation || false
        });
      } else {
        res.status(500).json({ message: 'Erro ao gerar pagamento' });
      }

    } catch (error) {
      console.error("Erro ao gerar pagamento do contrato:", error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post("/api/payments/asaas", csrfProtection, async (req, res) => {
    try {
      const { billingType, value, dueDate, description, customerName, customerEmail, customerPhone, customerDocument, contractId } = req.body;

      console.log('📥 Dados recebidos para pagamento:', {
        billingType,
        value,
        dueDate,
        description,
        customerName,
        customerEmail,
        customerPhone,
        customerDocument,
        contractId
      });

      // Validar dados obrigatórios
      if (!value || !dueDate || !description || !customerName || !customerEmail) {
        console.error("❌ Dados obrigatórios faltando");
        return res.status(400).json({ 
          success: false,
          message: "Dados obrigatórios faltando: value, dueDate, description, customerName, customerEmail"
        });
      }

      // Validar formato da data usando regex literal
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dueDate)) {
        return res.status(400).json({ 
          success: false,
          message: "Data de vencimento deve estar no formato YYYY-MM-DD"
        });
      }

      // Validar valor
      const numericValue = parseFloat(value.toString().replace(',', '.'));
      if (isNaN(numericValue) || numericValue <= 0) {
        return res.status(400).json({ 
          success: false,
          message: "Valor deve ser um número positivo"
        });
      }

      // Validar email usando função segura
      if (!isValidEmail(customerEmail)) {
        return res.status(400).json({ 
          success: false,
          message: "Email inválido"
        });
      }

      // Usar serviço de pagamento simplificado
      const result = await paymentServiceSimple.createPayment({
        billingType: billingType || 'PIX',
        value: value.toString(),
        dueDate,
        description,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        customerDocument: customerDocument || '',
        contractId
      });

      console.log('✅ Pagamento criado com sucesso:', result);
      res.json(result);

    } catch (error) {
      console.error("❌ Erro ao criar cobrança:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  });

  // Admin routes para perfil
  app.post("/api/admin/update-profile", async (req, res) => {
    try {
      const { adminName, adminEmail, currentLogin, systemSettings } = req.body;

      // Aqui você pode salvar as configurações no banco ou arquivo
      // Por enquanto, apenas retornamos sucesso

      res.json({ 
        success: true, 
        message: "Perfil atualizado com sucesso",
        data: { adminName, adminEmail, currentLogin, systemSettings }
      });
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validação simples da senha atual (em produção usar hash)
      const adminPassword = process.env.ADMIN_PASSWORD || "apontt2025!"; // Senha do ambiente

      if (currentPassword !== adminPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Aqui você salvaria a nova senha hasheada no banco
      // Por enquanto, apenas retornamos sucesso

      res.json({ 
        success: true, 
        message: "Senha alterada com sucesso" 
      });
    } catch (error) {
      console.error("Error changing admin password:", error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // Teste de conexão Asaas
  app.get("/api/test-asaas", async (_req, res) => {
    try {
      const result = await testAsaasConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        valid: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        environment: "unknown"
      });
    }
  });

  // AI Insights routes
  app.get("/api/ai-insights", async (_req, res) => {
    try {
      const insights = await storage.getAIInsights();
      res.json(insights);
    } catch (error) {
      console.error("Erro ao buscar insights:", error);
      res.status(500).json({ message: "Erro ao buscar insights" });
    }
  });

  app.post("/api/ai-insights/generate", async (_req, res) => {
    try {
      // Coletar dados financeiros
      const customers = await storage.getCustomers();
      const payments = await storage.getPayments();
      const partners = await storage.getPartners();
      const contracts = await storage.getContracts();

      // Calcular métricas
      const totalRevenue = payments
        .filter(p => p.status === 'RECEIVED')
        .reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);

      const paidPayments = payments.filter(p => p.status === 'RECEIVED').length;
      const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
      const overduePayments = payments.filter(p => p.status === 'OVERDUE').length;

      const averageTicket = payments.length > 0 
        ? payments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0) / payments.length 
        : 0;

      const totalCustomers = customers.length;
      const qualifiedCustomers = customers.filter(c => c.status === 'qualified' || c.status === 'customer').length;
      const conversionRate = totalCustomers > 0 ? (qualifiedCustomers / totalCustomers) * 100 : 0;

      const financialData: FinancialData = {
        totalRevenue,
        totalPayments: payments.length,
        paidPayments,
        pendingPayments,
        overduePayments,
        averageTicket,
        conversionRate,
        topCustomers: customers
          .sort((a, b) => parseFloat(b.value?.toString() || '0') - parseFloat(a.value?.toString() || '0'))
          .slice(0, 5)
          .map(c => ({
            name: c.name,
            value: parseFloat(c.value?.toString() || '0'),
            status: c.status
          })),
        monthlyTrend: [], // Could be implemented with date filtering
        partnerPerformance: partners.map(p => ({
          name: p.name,
          contracts: contracts.filter(c => c.partnerId === p.id).length,
          revenue: contracts
            .filter(c => c.partnerId === p.id && c.status === 'signed')
            .reduce((sum, c) => sum + parseFloat(c.value?.toString() || '0'), 0)
        }))
      };

      // Gerar insights de IA
      const insights = await generateFinancialInsights(financialData);
      const recommendations = await generateBusinessRecommendations(insights);

      const insightsData = {
        insights,
        recommendations,
        lastUpdated: new Date().toISOString()
      };

      // Salvar insights no storage
      await storage.saveAIInsights(insightsData);

      res.json({ success: true, data: insightsData });
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao gerar insights" 
      });
    }
  });

  // Ratings routes
  app.get("/api/ratings", async (_req, res) => {
    try {
      const ratings = await storage.getRatings();
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ratings" });
    }
  });

  app.post("/api/ratings", async (req, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating(validatedData);
      res.json(rating);
    } catch (error) {
      console.error("Erro ao criar rating:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao criar rating" });
    }
  });

  app.get("/api/ratings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rating = await storage.getRating(id);
      if (!rating) {
        return res.status(404).json({ message: "Rating não encontrado" });
      }
      res.json(rating);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar rating" });
    }
  });

  // WhatsApp integration routes
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { phone, message, partnerId } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ message: "Telefone e mensagem são obrigatórios" });
      }

      // Limpar telefone (remover caracteres especiais)
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Criar URL do WhatsApp
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;

      // Registrar atividade se partnerId fornecido
      if (partnerId) {
        await storage.createActivity({
          type: "whatsapp_sent",
          description: `WhatsApp enviado para ${phone}`,
          relatedId: partnerId,
        });
      }

      res.json({
        success: true,
        url: whatsappUrl
      });
    } catch (error) {
      console.error("Erro ao preparar WhatsApp:", error);
      res.status(500).json({ message: "Erro ao preparar envio WhatsApp" });
    }
  });

  }