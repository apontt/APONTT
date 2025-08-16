import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  company: text("company"),
  cnpj: text("cnpj"),
  region: text("region"),
  city: text("city"),
  state: text("state"),
  address: text("address"),
  observations: text("observations"),
  status: text("status").notNull().default("active"), // active, inactive, pending
  totalSales: text("total_sales").default("0"),
  totalCommissions: text("total_commissions").default("0"),
  adminFeeRate: text("admin_fee_rate").default("5.00"), // Taxa administrativa
  accessEnabled: integer("access_enabled", { mode: 'boolean' }).default(false),
  dashboardToken: text("dashboard_token").unique(),
  lastAccess: timestamp("last_access"),
  accessCount: integer("access_count").default(0),
  accessLog: text("access_log").default('[]'),
  lastActivity: text("last_activity"),
  createdAt: text("created_at"),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  clientDocument: text("client_document"), // CPF/CNPJ
  type: text("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  terms: text("terms"),
  content: text("content"), // Conteúdo completo do contrato em HTML
  templateType: text("template_type").default("default"), // tipo de template
  signatureLink: text("signature_link"), // Link público para assinatura
  linkToken: text("link_token"), // Token único para o link público
  linkExpiresAt: timestamp("link_expires_at"), // Expiração do link
  clientSignature: text("client_signature"), // Assinatura digital do cliente
  clientIpAddress: text("client_ip_address"), // IP do cliente ao assinar
  status: text("status").notNull().default("pending"), // pending, awaiting_signature, signed, cancelled
  authorizationTermSigned: boolean("authorization_term_signed").default(false),
  authorizationSignedAt: timestamp("authorization_signed_at"),
  authorizationSignerIp: text("authorization_signer_ip"),
  authorizationSignature: text("authorization_signature"),
  contractSignature: text("contract_signature"),
  partnerId: integer("partner_id"), // ID do parceiro responsável
  partnerCommission: decimal("partner_commission", { precision: 10, scale: 2 }), // Comissão calculada
  createdAt: timestamp("created_at").defaultNow(),
  signedAt: timestamp("signed_at"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  cpf: text("cpf").notNull(), // CPF obrigatório
  company: text("company"),
  document: text("document"), // CPF/CNPJ
  address: text("address"),
  zipCode: text("zip_code"),
  city: text("city"),
  state: text("state"),
  asaasCustomerId: text("asaas_customer_id"), // ID do cliente no Asaas
  status: text("status").notNull().default("lead"), // lead, qualified, customer
  value: decimal("value", { precision: 10, scale: 2 }).default("0"),
  partnerId: integer("partner_id"), // ID do parceiro responsável
  createdAt: timestamp("created_at").defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  customerId: integer("customer_id").references(() => customers.id),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  stage: text("stage").notNull().default("prospecting"), // prospecting, qualified, proposal, negotiation, closed-won, closed-lost
  probability: integer("probability").default(10), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // contract_signed, partner_added, meeting_scheduled, etc
  description: text("description").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  relatedId: integer("related_id").notNull(), // ID of related entity
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  asaasId: text("asaas_id").unique(), // ID da cobrança no Asaas
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerDocument: text("customer_document").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  description: text("description").notNull(),
  billingType: text("billing_type").notNull(), // PIX, BOLETO, CREDIT_CARD, etc.
  status: text("status").notNull().default("PENDING"), // PENDING, RECEIVED, OVERDUE, etc.
  invoiceUrl: text("invoice_url"),
  bankSlipUrl: text("bank_slip_url"),
  pixCode: text("pix_code"),
  isSimulation: boolean("is_simulation").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  insights: text("insights").notNull(), // JSON string of insights array
  recommendations: text("recommendations").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  nomeCompleto: text("nome_completo").notNull(),
  cpf: text("cpf").notNull(),
  dataExpedicaoRG: text("data_expedicao_rg").notNull(),
  tituloEleitor: text("titulo_eleitor").notNull(),
  nomePai: text("nome_pai").notNull(),
  nomeMae: text("nome_mae").notNull(),
  estadoCivil: text("estado_civil").notNull(),
  estadoRG: text("estado_rg").notNull(),
  email: text("email").notNull(),
  cep: text("cep").notNull(),
  endereco: text("endereco").notNull(),
  numero: text("numero").notNull(),
  cidade: text("cidade").notNull(),
  bairro: text("bairro").notNull(),
  telefoneResidencial: text("telefone_residencial"),
  celular: text("celular").notNull(),
  grauInstrucao: text("grau_instrucao").notNull(),
  rendaFamiliar: text("renda_familiar").notNull(),
  bancosVinculo: text("bancos_vinculo").notNull(),
  placaVeiculo: text("placa_veiculo"),
  anoVeiculo: text("ano_veiculo"),
  referencia1Nome: text("referencia_1_nome").notNull(),
  referencia1Telefone: text("referencia_1_telefone").notNull(),
  referencia1Parentesco: text("referencia_1_parentesco").notNull(),
  referencia2Nome: text("referencia_2_nome").notNull(),
  referencia2Telefone: text("referencia_2_telefone").notNull(),
  referencia2Parentesco: text("referencia_2_parentesco").notNull(),
  referencia3Nome: text("referencia_3_nome").notNull(),
  referencia3Telefone: text("referencia_3_telefone").notNull(),
  referencia3Parentesco: text("referencia_3_parentesco").notNull(),
  empresaTrabalha: text("empresa_trabalha").notNull(),
  dataAdmissao: text("data_admissao").notNull(),
  renda: text("renda").notNull(),
  ocupacao: text("ocupacao").notNull(),
  senhaSerasa: text("senha_serasa").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  totalSales: true,
  totalCommissions: true,
  lastActivity: true,
  accessEnabled: true,
  dashboardToken: true,
  lastAccess: true,
  createdAt: true,
}).extend({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  signedAt: true,
  linkToken: true,
  linkExpiresAt: true,
  clientSignature: true,
  clientIpAddress: true,
}).extend({
  clientDocument: z.string().min(11, "CPF é obrigatório para gerar pagamentos"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
}).extend({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

// Tabela de Termos de Autorização
export const authorizationTerms = pgTable("authorization_terms", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientDocument: text("client_document").notNull(),
  content: text("content").notNull(), // Conteúdo completo do termo em HTML
  signatureLink: text("signature_link"), // Link público para assinatura
  linkToken: text("link_token"), // Token único para o link público
  linkExpiresAt: timestamp("link_expires_at"), // Expiração do link
  clientSignature: text("client_signature"), // Assinatura digital do cliente
  clientIpAddress: text("client_ip_address"), // IP do cliente ao assinar
  status: text("status").notNull().default("pending"), // pending, awaiting_signature, signed, cancelled
  partnerId: integer("partner_id"), // ID do parceiro responsável
  createdAt: timestamp("created_at").defaultNow(),
  signedAt: timestamp("signed_at"),
});

export const insertAuthorizationTermSchema = createInsertSchema(authorizationTerms).omit({
  id: true,
  createdAt: true,
  signedAt: true,
  linkToken: true,
  linkExpiresAt: true,
  clientSignature: true,
  clientIpAddress: true,
});

export type InsertAuthorizationTerm = z.infer<typeof insertAuthorizationTermSchema>;
export type AuthorizationTerm = typeof authorizationTerms.$inferSelect;

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SelectRating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;