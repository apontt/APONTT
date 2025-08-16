import { z } from 'zod';

// Partner schema
export const insertPartnerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  type: z.string().optional(),
  adminFee: z.number().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;

export type Partner = InsertPartner & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

// Customer schema
export const insertCustomerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(["active", "inactive", "limpa_nome"]).default("active"),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Customer = z.infer<typeof insertCustomerSchema> & {
  id: number;
  partnerId: number;
  createdAt: string;
  updatedAt: string;
};

// Contract schema
export const contractSchema = z.object({
  clientName: z.string().min(1, "Nome obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  clientPhone: z.string().optional(),
  clientDocument: z.string().optional(),
  type: z.string().min(1, "Tipo obrigatório"),
  value: z.string().min(1, "Valor obrigatório"),
  description: z.string().optional(),
  status: z.enum(["draft", "sent", "signed", "paid", "completed", "cancelled"]).default("draft"),
});

export type Contract = z.infer<typeof contractSchema> & {
  id: number;
  partnerId: number;
  customerId?: number;
  token?: string;
  signatureDate?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
};

// Opportunity schema
export type Opportunity = {
  id: number;
  title: string;
  description: string;
  value: number;
  probability: number;
  status: "open" | "won" | "lost";
  customerId: number;
  customer: Customer;
  partnerId: number;
  createdAt: string;
  updatedAt: string;
};

// Activity schema
export type Activity = {
  id: number;
  type: "contract_signed" | "partner_registered" | "customer_added" | "payment_received";
  description: string;
  entityId: number;
  entityType: "contract" | "partner" | "customer" | "payment";
  createdAt: string;
};

// Next Action schema
export type NextAction = {
  id: string;
  type: "contract" | "customer" | "opportunity" | "scheduled";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  scheduledDate?: Date;
  relatedTo: string;
  action: string;
  icon: any;
  isCompleted: boolean;
};