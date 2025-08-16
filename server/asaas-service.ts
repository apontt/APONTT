import { validateAsaasApiKey, getAsaasConfig } from './asaas-validator';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  externalReference?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export class AsaasService {
  private config: ReturnType<typeof getAsaasConfig> | null = null;
  
  constructor() {
    try {
      this.config = getAsaasConfig();
    } catch (error) {
      console.warn('Asaas API não configurada, serviço funcionará em modo limitado');
      this.config = null;
    }
  }

  private ensureConfigured(): ReturnType<typeof getAsaasConfig> {
    if (!this.config) {
      throw new Error('Serviço Asaas não configurado. Configure ASAAS_API_KEY nas variáveis de ambiente.');
    }
    return this.config;
  }

  private getHeaders(): HeadersInit {
    const config = this.ensureConfigured();
    return {
      'Content-Type': 'application/json',
      'access_token': config.apiKey || '',
      'User-Agent': 'Apontt-System/1.0'
    };
  }

  async validateConnection(): Promise<{ valid: boolean; message: string; environment: string }> {
    try {
      const config = this.ensureConfigured();
      const response = await fetch(`${config.url}/myAccount`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: 'Conexão com Asaas estabelecida com sucesso',
          environment: config.environment
        };
      } else {
        const errorData = await response.json();
        return {
          valid: false,
          message: errorData.errors?.[0]?.description || 'Falha na autenticação com Asaas',
          environment: config.environment
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: `Erro de conectividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        environment: 'unknown'
      };
    }
  }

  async createCustomer(customerData: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj?: string;
  }): Promise<AsaasCustomer> {
    const config = this.ensureConfigured();
    const response = await fetch(`${config.url}/customers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || '',
        cpfCnpj: customerData.cpfCnpj || '',
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Se cliente já existe, buscar por email
      if (data.errors?.[0]?.description?.includes('já cadastrado') || 
          data.errors?.[0]?.code === 'email_already_exists') {
        const existingCustomer = await this.findCustomerByEmail(customerData.email);
        if (existingCustomer) {
          return existingCustomer;
        }
      }
      
      throw new Error(data.errors?.[0]?.description || data.message || 'Erro ao criar cliente');
    }

    return data;
  }

  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    try {
      const config = this.ensureConfigured();
      const response = await fetch(`${config.url}/customers?email=${encodeURIComponent(email)}`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.[0] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente por email:', error);
      return null;
    }
  }

  async createPayment(paymentData: {
    customer: string;
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
    value: number;
    dueDate: string;
    description: string;
    externalReference?: string;
  }): Promise<AsaasPayment> {
    const config = this.ensureConfigured();
    const response = await fetch(`${config.url}/payments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        customer: paymentData.customer,
        billingType: paymentData.billingType,
        value: paymentData.value,
        dueDate: paymentData.dueDate,
        description: paymentData.description,
        externalReference: paymentData.externalReference || `payment_${Date.now()}`,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.description || data.message || 'Erro ao criar cobrança');
    }

    return data;
  }

  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode | null> {
    try {
      const config = this.ensureConfigured();
      const response = await fetch(`${config.url}/payments/${paymentId}/pixQrCode`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      return null;
    }
  }

  async deletePayment(paymentId: string): Promise<boolean> {
    try {
      const config = this.ensureConfigured();
      const response = await fetch(`${config.url}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao deletar cobrança:', error);
      return false;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<AsaasPayment | null> {
    try {
      const config = this.ensureConfigured();
      const response = await fetch(`${config.url}/payments/${paymentId}`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar status do pagamento:', error);
      return null;
    }
  }

  // REMOVIDO: Modo simulação desativado completamente
}

// Instância singleton do serviço
export const asaasService = new AsaasService();