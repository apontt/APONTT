import { 
  users, partners, contracts, customers, opportunities, activities, authorizationTerms, payments, aiInsights, ratings,
  type User, type InsertUser,
  type Partner, type InsertPartner,
  type Contract, type InsertContract,
  type Customer, type InsertCustomer,
  type Opportunity, type InsertOpportunity,
  type Activity, type InsertActivity,
  type AuthorizationTerm, type InsertAuthorizationTerm,
  type Payment, type InsertPayment,
  type AIInsight, type InsertAIInsight,
  type SelectRating, type InsertRating
} from "@shared/schema-sqlite";
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
  logPartnerAccess(id: number): Promise<void>;
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
  deleteCustomer(id: number): Promise<boolean>;
  getCustomersByPartnerId(partnerId: number): Promise<Customer[]>;

  // Opportunities
  getOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Authorization Terms
  getAuthorizationTerms(): Promise<AuthorizationTerm[]>;
  getAuthorizationTerm(id: number): Promise<AuthorizationTerm | undefined>;
  createAuthorizationTerm(term: InsertAuthorizationTerm): Promise<AuthorizationTerm>;
  updateAuthorizationTerm(id: number, term: Partial<InsertAuthorizationTerm>): Promise<AuthorizationTerm | undefined>;
  deleteAuthorizationTerm(id: number): Promise<boolean>;
  getAuthorizationTermByToken(token: string): Promise<AuthorizationTerm | undefined>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;

  // AI Insights
  getAIInsights(): Promise<any>;
  saveAIInsights(data: any): Promise<void>;

  // Ratings
  getRatings(): Promise<SelectRating[]>;
  getRating(id: number): Promise<SelectRating | undefined>;
  createRating(rating: InsertRating): Promise<SelectRating>;

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

  async generatePartnerDashboardToken(id: number): Promise<string> {
    const token = `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.update(partners)
      .set({ dashboardToken: token })
      .where(eq(partners.id, id));
    return token;
  }

  async updatePartnerAccess(id: number, enabled: boolean): Promise<Partner | undefined> {
    const [partner] = await db.update(partners)
      .set({ accessEnabled: enabled })
      .where(eq(partners.id, id))
      .returning();
    return partner || undefined;
  }

  async getPartnerByToken(token: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.dashboardToken, token));
    return partner || undefined;
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

  async updatePartnerLastAccess(partnerId: number): Promise<void> {
    await db.update(partners)
      .set({ lastAccess: new Date() })
      .where(eq(partners.id, partnerId));
  }

  async logPartnerAccess(id: number): Promise<void> {
    const partner = await this.getPartner(id);
    if (partner) {
      const accessLog = partner.accessLog || [];
      const newAccessLog = [...accessLog, new Date().toISOString()].slice(-50);
      
      await db.update(partners)
        .set({ 
          lastAccess: new Date(),
          accessCount: (partner.accessCount || 0) + 1,
          accessLog: newAccessLog
        })
        .where(eq(partners.id, id));
    }
  }

  async updatePartnerSales(partnerId: number, totalSales: number, totalCommissions: number): Promise<void> {
    await db.update(partners)
      .set({ 
        totalSales: totalSales.toString(),
        totalCommissions: totalCommissions.toString() 
      })
      .where(eq(partners.id, partnerId));
  }

  async getCustomersByPartnerId(partnerId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.partnerId, partnerId));
  }

  async getContractsByPartnerId(partnerId: number): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.partnerId, partnerId));
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

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt));
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

  async deleteContract(id: number): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  async getContractByToken(token: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.linkToken, token));
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

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values({
      ...insertCustomer,
      partnerId: insertCustomer.partnerId || null
    }).returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
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



  // Authorization Terms
  async getAuthorizationTerms(): Promise<AuthorizationTerm[]> {
    return await db.select().from(authorizationTerms).orderBy(desc(authorizationTerms.createdAt));
  }

  async getAuthorizationTerm(id: number): Promise<AuthorizationTerm | undefined> {
    const [term] = await db.select().from(authorizationTerms).where(eq(authorizationTerms.id, id));
    return term;
  }

  async createAuthorizationTerm(term: InsertAuthorizationTerm): Promise<AuthorizationTerm> {
    const [newTerm] = await db.insert(authorizationTerms).values(term).returning();
    return newTerm;
  }

  async updateAuthorizationTerm(id: number, term: Partial<InsertAuthorizationTerm>): Promise<AuthorizationTerm | undefined> {
    const [updatedTerm] = await db.update(authorizationTerms)
      .set(term)
      .where(eq(authorizationTerms.id, id))
      .returning();
    return updatedTerm;
  }

  async deleteAuthorizationTerm(id: number): Promise<boolean> {
    const result = await db.delete(authorizationTerms).where(eq(authorizationTerms.id, id));
    return (result as any).rowCount > 0;
  }

  async getAuthorizationTermByToken(token: string): Promise<AuthorizationTerm | undefined> {
    const [term] = await db.select().from(authorizationTerms).where(eq(authorizationTerms.linkToken, token));
    return term;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db.update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // AI Insights
  async getAIInsights(): Promise<any> {
    const [insights] = await db.select().from(aiInsights).orderBy(desc(aiInsights.createdAt));
    if (!insights) {
      return null;
    }
    
    return {
      insights: JSON.parse(insights.insights),
      recommendations: insights.recommendations,
      lastUpdated: insights.lastUpdated?.toISOString() || new Date().toISOString()
    };
  }

  async saveAIInsights(data: any): Promise<void> {
    await db.insert(aiInsights).values({
      insights: JSON.stringify(data.insights),
      recommendations: data.recommendations,
      lastUpdated: new Date()
    });
  }

  // Metrics implementation
  async getMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all data
    const allCustomers = await this.getCustomers();
    const allPartners = await this.getPartners();
    const allPayments = await this.getPayments();
    const allContracts = await this.getContracts();

    // Calculate metrics
    const monthSales = allPayments
      .filter(p => p.status === 'RECEIVED' && p.createdAt && p.createdAt >= thirtyDaysAgo)
      .reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);

    const newLeads = allCustomers.filter(c => 
      c.status === 'lead' && c.createdAt && c.createdAt >= thirtyDaysAgo
    ).length;

    const totalCustomers = allCustomers.length;
    const qualifiedCustomers = allCustomers.filter(c => 
      c.status === 'qualified' || c.status === 'customer'
    ).length;
    const conversionRate = totalCustomers > 0 ? (qualifiedCustomers / totalCustomers) * 100 : 0;

    const activePartners = allPartners.filter(p => p.status === 'active').length;

    return {
      monthSales,
      newLeads,
      conversionRate,
      activePartners,
      salesGrowth: 0, // Could be calculated with historical data
      leadsGrowth: 0,
      conversionGrowth: 0,
      partnersGrowth: 0
    };
  }

  // Ratings
  async getRatings(): Promise<SelectRating[]> {
    return await db.select().from(ratings).orderBy(desc(ratings.createdAt));
  }

  async getRating(id: number): Promise<SelectRating | undefined> {
    const [rating] = await db.select().from(ratings).where(eq(ratings.id, id));
    return rating || undefined;
  }

  async createRating(insertRating: InsertRating): Promise<SelectRating> {
    const [rating] = await db.insert(ratings).values(insertRating).returning();
    return rating;
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