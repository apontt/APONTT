import { 
  users, partners, contracts, customers, opportunities, activities,
  type User, type InsertUser,
  type Partner, type InsertPartner,
  type Contract, type InsertContract,
  type Customer, type InsertCustomer,
  type Opportunity, type InsertOpportunity,
  type Activity, type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Partners
  getPartners(): Promise<Partner[]>;
  getPartner(id: number): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: number, partner: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: number): Promise<boolean>;
  generatePartnerDashboardToken(id: number): Promise<string>;
  updatePartnerAccess(id: number, enabled: boolean): Promise<Partner | undefined>;
  getPartnerByToken(token: string): Promise<Partner | undefined>;
  updatePartnerLastAccess(id: number): Promise<void>;
  updatePartnerSales(id: number, totalSales: number, totalCommissions: number): Promise<void>;
  getCustomersByPartnerId(partnerId: number): Promise<Customer[]>;
  getContractsByPartnerId(partnerId: number): Promise<Contract[]>;
  getPartnerData(token: string): Promise<any>;

  // Contracts
  getContracts(): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<void>;
  getContractByToken(token: string): Promise<Contract | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Opportunities
  getOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Metrics
  getMetrics(): Promise<{
    monthSales: number;
    newLeads: number;
    conversionRate: number;
    activePartners: number;
    salesGrowth: number;
    leadsGrowth: number;
    conversionGrowth: number;
    partnersGrowth: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private partners: Map<number, Partner>;
  private contracts: Map<number, Contract>;
  private customers: Map<number, Customer>;
  private opportunities: Map<number, Opportunity>;
  private activities: Map<number, Activity>;

  private currentUserId: number;
  private currentPartnerId: number;
  private currentContractId: number;
  private currentCustomerId: number;
  private currentOpportunityId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.partners = new Map();
    this.contracts = new Map();
    this.customers = new Map();
    this.opportunities = new Map();
    this.activities = new Map();

    this.currentUserId = 1;
    this.currentPartnerId = 1;
    this.currentContractId = 1;
    this.currentCustomerId = 1;
    this.currentOpportunityId = 1;
    this.currentActivityId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Partners
  async getPartners(): Promise<Partner[]> {
    return Array.from(this.partners.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getPartner(id: number): Promise<Partner | undefined> {
    return this.partners.get(id);
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const id = this.currentPartnerId++;
    const partner: Partner = {
      ...insertPartner,
      id,
      status: insertPartner.status || "active",
      company: insertPartner.company || null,
      cnpj: insertPartner.cnpj || null,
      region: insertPartner.region || null,
      address: insertPartner.address || null,
      observations: insertPartner.observations || null,
      totalSales: "0",
      lastActivity: new Date(),
      createdAt: new Date(),
    };
    this.partners.set(id, partner);

    // Create activity
    await this.createActivity({
      type: "partner_added",
      description: `Novo parceiro cadastrado: ${partner.name}`,
      relatedId: id,
    });

    return partner;
  }

  async updatePartner(id: number, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const partner = this.partners.get(id);
    if (!partner) return undefined;

    const updatedPartner = { ...partner, ...updateData, lastActivity: new Date() };
    this.partners.set(id, updatedPartner);
    return updatedPartner;
  }

  async deletePartner(id: number): Promise<boolean> {
    return this.partners.delete(id);
  }

  async generatePartnerDashboardToken(id: number): Promise<string> {
    const partner = this.partners.get(id);
    if (!partner) {
      throw new Error("Parceiro não encontrado");
    }
    
    const token = `pd_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const updatedPartner = { 
      ...partner, 
      dashboardToken: token,
      accessEnabled: true,
      lastActivity: new Date()
    };
    this.partners.set(id, updatedPartner);
    
    return token;
  }

  async getPartnerByDashboardToken(token: string): Promise<Partner | undefined> {
    return Array.from(this.partners.values()).find(p => p.dashboardToken === token);
  }

  async getPartnerByToken(token: string): Promise<Partner | undefined> {
    return Array.from(this.partners.values()).find(p => p.dashboardToken === token);
  }

  async updatePartnerLastAccess(id: number): Promise<void> {
    const partner = this.partners.get(id);
    if (partner) {
      const updatedPartner = { ...partner, lastAccess: new Date() };
      this.partners.set(id, updatedPartner);
    }
  }

  async updatePartnerSales(id: number, totalSales: number, totalCommissions: number): Promise<void> {
    const partner = this.partners.get(id);
    if (partner) {
      const updatedPartner = { 
        ...partner, 
        totalSales: totalSales.toString(),
        totalCommissions: totalCommissions.toString()
      };
      this.partners.set(id, updatedPartner);
    }
  }

  async getCustomersByPartnerId(partnerId: number): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(c => c.partnerId === partnerId);
  }

  async getContractsByPartnerId(partnerId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(c => c.partnerId === partnerId);
  }

  async updatePartnerAccess(id: number, enabled: boolean): Promise<Partner | undefined> {
    const partner = this.partners.get(id);
    if (!partner) return undefined;
    
    const updateData: any = { 
      accessEnabled: enabled,
      lastActivity: new Date()
    };
    if (!enabled) {
      updateData.dashboardToken = null;
    }
    
    const updatedPartner = { ...partner, ...updateData };
    this.partners.set(id, updatedPartner);
    return updatedPartner;
  }

  async getPartnerData(token: string): Promise<{
    partner: Partner;
    contracts: Contract[];
    customers: Customer[];
  }> {
    const partner = this.getPartnerByDashboardToken(token);
    if (!partner || !partner.accessEnabled) {
      throw new Error("Acesso negado ou parceiro não encontrado");
    }

    // Atualizar último acesso
    const updatedPartner = { ...partner, lastAccess: new Date() };
    this.partners.set(partner.id, updatedPartner);

    // Para este exemplo, retornar apenas dados relacionados ao parceiro
    const contracts = Array.from(this.contracts.values()).filter(c => 
      c.clientEmail?.includes(partner.email.split('@')[0]) || 
      c.clientName?.toLowerCase().includes(partner.name.toLowerCase().split(' ')[0])
    );
    
    const customers = Array.from(this.customers.values()).filter(c => 
      c.email?.includes(partner.email.split('@')[0]) || 
      c.name?.toLowerCase().includes(partner.name.toLowerCase().split(' ')[0])
    );

    return {
      partner: updatedPartner,
      contracts,
      customers
    };
  }

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.currentContractId++;
    const contract: Contract = {
      ...insertContract,
      id,
      status: insertContract.status || "pending",
      createdAt: new Date(),
      signedAt: null,
      linkToken: null,
      linkExpiresAt: null,
      signatureLink: null,
      clientSignature: null,
      clientIpAddress: null,
      authorizationTermSigned: false,
      authorizationSignedAt: null,
      authorizationSignerIp: null,
    };
    this.contracts.set(id, contract);

    // Create activity
    await this.createActivity({
      type: "contract_created",
      description: `Novo contrato criado para ${contract.clientName}`,
      value: contract.value,
      relatedId: id,
    });

    return contract;
  }

  async updateContract(id: number, updateData: Partial<InsertContract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    const updatedContract = { ...contract, ...updateData };

    // If status changed to signed, set signedAt
    if (updateData.status === "signed" && contract.status !== "signed") {
      updatedContract.signedAt = new Date();

      // Create activity for signed contract
      await this.createActivity({
        type: "contract_signed",
        description: `Contrato assinado com ${contract.clientName}`,
        value: contract.value,
        relatedId: id,
      });
    }

    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  async deleteContract(id: number): Promise<void> {
    this.contracts.delete(id);
  }

  async getContractByToken(token: string): Promise<Contract | undefined> {
    return Array.from(this.contracts.values()).find(c => c.linkToken === token);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const customer: Customer = {
      ...insertCustomer,
      id,
      document: insertCustomer.document || null,
      phone: insertCustomer.phone || null,
      company: insertCustomer.company || null,
      address: insertCustomer.address || null,
      zipCode: insertCustomer.zipCode || null,
      city: insertCustomer.city || null,
      state: insertCustomer.state || null,
      asaasCustomerId: insertCustomer.asaasCustomerId || null,
      status: insertCustomer.status || "lead",
      value: insertCustomer.value || null,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...updateData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Opportunities
  async getOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.currentOpportunityId++;
    const opportunity: Opportunity = {
      ...insertOpportunity,
      id,
      description: insertOpportunity.description || null,
      customerId: insertOpportunity.customerId || null,
      stage: insertOpportunity.stage || "prospecting",
      probability: insertOpportunity.probability || 10,
      expectedCloseDate: insertOpportunity.expectedCloseDate || null,
      createdAt: new Date(),
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: number, updateData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;

    const updatedOpportunity = { ...opportunity, ...updateData };
    this.opportunities.set(id, updatedOpportunity);
    return updatedOpportunity;
  }

  // Activities
  async getActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      value: insertActivity.value || null,
      relatedId: insertActivity.relatedId || null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Metrics
  async getMetrics() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate monthly sales from signed contracts
    const signedContracts = Array.from(this.contracts.values())
      .filter(c => c.status === "signed" && c.signedAt);

    const monthSales = signedContracts
      .filter(c => {
        const signedDate = new Date(c.signedAt!);
        return signedDate.getMonth() === currentMonth && signedDate.getFullYear() === currentYear;
      })
      .reduce((sum, c) => sum + parseFloat(c.value), 0);

    // Count new leads this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newLeads = Array.from(this.customers.values())
      .filter(c => c.status === "lead" && new Date(c.createdAt || 0) > weekAgo).length;

    // Calculate conversion rate
    const totalLeads = Array.from(this.customers.values()).filter(c => c.status === "lead").length;
    const convertedCustomers = Array.from(this.customers.values()).filter(c => c.status === "customer").length;
    const conversionRate = totalLeads > 0 ? (convertedCustomers / totalLeads) * 100 : 0;

    // Count active partners
    const activePartners = Array.from(this.partners.values()).filter(p => p.status === "active").length;

    return {
      monthSales,
      newLeads,
      conversionRate,
      activePartners,
      salesGrowth: 12.5, // Simulated growth percentages
      leadsGrowth: 8.2,
      conversionGrowth: -2.1,
      partnersGrowth: 5.1,
    };
  }
}

import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Partners
  async getPartners(): Promise<Partner[]> {
    return await db.select().from(partners).orderBy(desc(partners.createdAt));
  }

  async getPartner(id: number): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner || undefined;
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(insertPartner).returning();
    return partner;
  }

  async updatePartner(id: number, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [partner] = await db.update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();
    return partner || undefined;
  }

  async deletePartner(id: number): Promise<boolean> {
    const result = await db.delete(partners).where(eq(partners.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt));
  }

  async deleteContract(id: number): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  async getContractByToken(token: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.linkToken, token));
    return contract || undefined;
  }

  async generatePartnerDashboardToken(partnerId: number): Promise<string> {
    const token = `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.update(partners)
      .set({ dashboardToken: token })
      .where(eq(partners.id, partnerId));
    return token;
  }

  async updatePartnerAccess(partnerId: number, enabled: boolean): Promise<Partner | undefined> {
    const [partner] = await db.update(partners)
      .set({ accessEnabled: enabled })
      .where(eq(partners.id, partnerId))
      .returning();
    return partner || undefined;
  }

  async getPartnerByToken(token: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.dashboardToken, token));
    return partner || undefined;
  }

  async updatePartnerLastAccess(partnerId: number): Promise<void> {
    await db.update(partners)
      .set({ lastAccess: new Date() })
      .where(eq(partners.id, partnerId));
  }

  async updatePartnerSales(partnerId: number, totalSales: number, totalCommissions: number): Promise<void> {
    await db.update(partners)
      .set({ 
        totalSales: totalSales.toString(),
        totalCommissions: totalCommissions.toString() 
      })
      .where(eq(partners.id, partnerId));
  }

  async getPartnerData(token: string): Promise<any> {
    const partner = await this.getPartnerByToken(token);
    if (!partner) {
      throw new Error('Token inválido ou parceiro não encontrado');
    }

    if (!partner.accessEnabled) {
      throw new Error('Acesso bloqueado para este parceiro');
    }

    // Atualizar último acesso
    await this.updatePartnerLastAccess(partner.id);

    // Buscar dados do parceiro
    const partnerCustomers = await db.select().from(customers).where(eq(customers.partnerId, partner.id));
    const partnerContracts = await db.select().from(contracts).where(eq(contracts.partnerId, partner.id));

    return { partner, customers: partnerCustomers, contracts: partnerContracts };
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values({
      ...insertContract,
      partnerId: insertContract.partnerId || null
    }).returning();
    return contract;
  }

  async updateContract(id: number, updateData: Partial<InsertContract>): Promise<Contract | undefined> {
    const [contract] = await db.update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id))
      .returning();
    return contract || undefined;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomersByPartnerId(partnerId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.partnerId, partnerId));
  }

  async getContractsByPartnerId(partnerId: number): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.partnerId, partnerId));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  // Opportunities
  async getOpportunities(): Promise<Opportunity[]> {
    return await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return opportunity || undefined;
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const [opportunity] = await db.insert(opportunities).values(insertOpportunity).returning();
    return opportunity;
  }

  async updateOpportunity(id: number, updateData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const [opportunity] = await db.update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, id))
      .returning();
    return opportunity || undefined;
  }

  // Activities
  async getActivities(limit: number = 50): Promise<Activity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Metrics
  async getMetrics(): Promise<{
    monthSales: number;
    newLeads: number;
    conversionRate: number;
    activePartners: number;
    salesGrowth: number;
    leadsGrowth: number;
    conversionGrowth: number;
    partnersGrowth: number;
  }> {
    // Implementar métricas baseadas nos dados reais do banco
    const allPartners = await this.getPartners();
    const allCustomers = await this.getCustomers();
    const allContracts = await this.getContracts();
    
    const monthSales = allContracts
      .filter(c => c.status === 'signed')
      .reduce((sum, c) => sum + parseFloat(c.value || '0'), 0);
    
    const newLeads = allCustomers.filter(c => c.status === 'lead').length;
    const totalCustomers = allCustomers.length;
    const signedContracts = allContracts.filter(c => c.status === 'signed').length;
    const conversionRate = totalCustomers > 0 ? (signedContracts / totalCustomers) * 100 : 0;
    const activePartners = allPartners.filter(p => p.status === 'active').length;

    return {
      monthSales,
      newLeads,
      conversionRate,
      activePartners,
      salesGrowth: 0, // Implementar cálculo real baseado em dados históricos
      leadsGrowth: 0,
      conversionGrowth: 0,
      partnersGrowth: 0,
    };
  }
}

export const storage = new DatabaseStorage();

// Inicializar dados padrão
async function initializeDefaultData() {
  try {
    // Verificar se já existe usuário admin
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      await storage.createUser({
        username: "admin",
        password: "123456"
      });
      console.log("Usuário admin criado com sucesso");
    }
  } catch (error) {
    console.error("Erro ao inicializar dados padrão:", error);
  }
}

// Executar inicialização
initializeDefaultData();