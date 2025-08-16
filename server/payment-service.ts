import { asaasService } from './asaas-service';
import { storage } from './storage';
import { sanitizeForLog } from './utils/sanitize';

export interface PaymentData {
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  value: string;
  dueDate: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerDocument?: string;
  contractId?: number;
}

export interface PaymentResult {
  success: boolean;
  payment: any;
  pixCode?: string;
  pixQrCodeImage?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  simulationMode?: boolean;
  message?: string;
}

export class PaymentService {
  
  async createPayment(paymentData: PaymentData): Promise<PaymentResult> {
    console.log(`Criando cobrança REAL para ${sanitizeForLog(paymentData.customerName)} - Valor: ${sanitizeForLog(paymentData.value)}`);

    try {
      // Criar cliente no Asaas
      const customer = await asaasService.createCustomer({
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: paymentData.customerPhone,
        cpfCnpj: paymentData.customerDocument,
      });

      console.log(`Cliente criado/encontrado com ID: ${sanitizeForLog(customer.id)}`);

      // Criar a cobrança no Asaas
      const payment = await asaasService.createPayment({
        customer: customer.id,
        billingType: paymentData.billingType === 'UNDEFINED' ? 'UNDEFINED' : paymentData.billingType,
        value: parseFloat(paymentData.value),
        dueDate: paymentData.dueDate,
        description: paymentData.description,
        externalReference: paymentData.contractId 
          ? `contract_${paymentData.contractId}` 
          : `wallet_payment_${Date.now()}`,
      });

      // Gerar QR Code PIX se for PIX
      let pixQrCode = null;
      if (paymentData.billingType === 'PIX' && payment.id) {
        pixQrCode = await asaasService.getPixQrCode(payment.id);
      }

      // Salvar cobrança no banco
      const paymentRecord = await storage.createPayment({
        asaasId: payment.id,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        customerPhone: paymentData.customerPhone || '',
        customerDocument: paymentData.customerDocument || '',
        value: paymentData.value.toString(),
        dueDate: new Date(paymentData.dueDate),
        description: paymentData.description,
        billingType: paymentData.billingType,
        status: payment.status || 'PENDING',
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        pixCode: pixQrCode?.payload,
        isSimulation: false
      });

      // Registrar atividade
      await storage.createActivity({
        type: "payment_created",
        description: `Cobrança criada para ${sanitizeForLog(paymentData.customerName)} - ${sanitizeForLog(paymentData.description)} (Valor: R$ ${sanitizeForLog(paymentData.value)})`,
        relatedId: paymentRecord.id,
      });

      console.log(`Cobrança criada com sucesso: ${payment.id}`);

      return {
        success: true,
        payment: payment,
        pixCode: pixQrCode?.payload,
        pixQrCodeImage: pixQrCode?.encodedImage,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        simulationMode: false,
        message: `Cobrança criada com sucesso`
      };

    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      throw new Error(`Erro ao criar cobrança: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async createContractPayment(contract: any): Promise<{ paymentUrl?: string; pixQrCode?: string }> {
    try {
      console.log(`Gerando pagamento automático para contrato ${contract.id}`);
      
      // Criar cliente no Asaas
      const customer = await asaasService.createCustomer({
        name: contract.clientName,
        email: contract.clientEmail,
        phone: contract.clientPhone,
        cpfCnpj: contract.clientDocument,
      });

      // Criar cobrança no Asaas
      const payment = await asaasService.createPayment({
        customer: customer.id,
        billingType: 'PIX',
        value: parseFloat(contract.value.toString()),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
        description: `Pagamento do contrato: ${contract.description || 'Contrato'}`,
        externalReference: `contract_${contract.id}`,
      });

      // Gerar QR Code PIX
      const pixData = await asaasService.getPixQrCode(payment.id);

      // Salvar pagamento no banco de dados
      await storage.createPayment({
        asaasId: payment.id,
        customerName: contract.clientName,
        customerEmail: contract.clientEmail,
        customerPhone: contract.clientPhone || '',
        customerDocument: contract.clientDocument || '',
        value: contract.value.toString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: `Pagamento do contrato: ${contract.description || 'Contrato'}`,
        billingType: 'PIX',
        status: payment.status || 'PENDING',
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        pixCode: pixData?.payload,
        isSimulation: false
      });

      console.log(`Pagamento gerado com sucesso: ${payment.id}`);

      return {
        paymentUrl: payment.invoiceUrl,
        pixQrCode: pixData?.payload
      };

    } catch (error) {
      console.error("Erro ao gerar pagamento automático:", error);
      throw new Error(`Erro ao gerar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export const paymentService = new PaymentService();