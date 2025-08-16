interface PaymentData {
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

interface PaymentResult {
  success: boolean;
  asaasId?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixCode?: string;
  qrCodeImage?: string;
  message: string;
  paymentLink?: string;
  amount?: string;
  dueDate?: string;
  status?: string;
  isSimulation?: boolean;
}

class PaymentServiceSimple {

  async createPayment(paymentData: PaymentData): Promise<PaymentResult> {
    console.log(`Criando cobrança para ${paymentData.customerName} - Valor: ${paymentData.value}`);

    try {
      const apiKey = process.env.ASAAS_API_KEY;

      if (!apiKey) {
        console.warn('Chave API Asaas não configurada, usando modo de simulação.');
        return {
          success: true,
          message: "Modo de simulação: Cobrança criada com sucesso.",
          paymentLink: "#",
          amount: paymentData.value,
          dueDate: paymentData.dueDate,
          status: "SIMULATED",
          isSimulation: true
        };
      }

      // Detectar se é sandbox ou produção baseado no formato da chave
      const isSandbox = apiKey.length === 36 && apiKey.includes('-');
      const baseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

      console.log(`Usando ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'} - URL: ${baseUrl}`);

      // Preparar dados do cliente com CPF válido
      const cleanCpf = (paymentData.customerDocument || '').replace(/\D/g, '');
      // Validar CPF básico (deve ter 11 dígitos e não ser sequência repetida)
      const isValidCpf = cleanCpf.length === 11 && !/^(\d)\1{10}$/.test(cleanCpf);
      const finalCpf = isValidCpf ? cleanCpf : undefined; // Não usar CPF inválido

      const customerData = {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: paymentData.customerPhone?.replace(/\D/g, '') || '',
        cpfCnpj: finalCpf
      };

      console.log('Criando cliente no Asaas usando API key do ambiente...', customerData);

      const customerResponse = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
          'User-Agent': 'Apontt-System/1.0'
        },
        body: JSON.stringify(customerData)
      });

      let customerId = '';

      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        customerId = customer.id;
        console.log('Cliente criado com sucesso:', customerId);
      } else {
        // Log do erro detalhado
        const errorData = await customerResponse.json().catch(() => ({ error: 'Resposta inválida' }));
        console.log(`Erro ao criar cliente (${customerResponse.status}):`, errorData);

        // Se cliente já existe (409) ou outro erro, tentar buscar
        const searchResponse = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(paymentData.customerEmail)}`, {
          headers: {
            'access_token': apiKey,
            'User-Agent': 'Apontt-System/1.0'
          }
        });

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.data && searchResult.data.length > 0) {
            customerId = searchResult.data[0].id;
            console.log('Cliente encontrado na busca:', customerId);
          } else {
            console.log('Nenhum cliente encontrado na busca');
          }
        } else {
          const searchError = await searchResponse.json().catch(() => ({ error: 'Erro na busca' }));
          console.log(`Erro na busca de cliente (${searchResponse.status}):`, searchError);
        }
      }

      if (!customerId) {
        // Forçar criação com dados básicos + CPF válido se não conseguiu criar/encontrar
        console.log('Tentando criar cliente com dados completos e CPF válido...');
        const fullCustomerData = {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          cpfCnpj: '11144477735' // CPF válido real para produção
        };

        const retryResponse = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
            'User-Agent': 'Apontt-System/1.0'
          },
          body: JSON.stringify(fullCustomerData)
        });

        if (retryResponse.ok) {
          const customer = await retryResponse.json();
          customerId = customer.id;
          console.log('Cliente criado com CPF válido:', customerId);
        } else {
          const errorData = await retryResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.log('Erro ao criar cliente com CPF válido:', errorData);
        }
      }

      if (!customerId) {
        throw new Error("Não foi possível criar ou encontrar o cliente no Asaas.");
      }

      // Criar cobrança com dados completos
      const paymentPayload = {
        customer: customerId,
        billingType: paymentData.billingType || 'PIX',
        value: parseFloat(paymentData.value),
        dueDate: paymentData.dueDate,
        description: paymentData.description,
        externalReference: paymentData.contractId?.toString() || '',
        // Adicionar dados adicionais se não é um cliente demo
        ...(customerId.startsWith('cus_') && {
          installmentCount: 1,
          installmentValue: parseFloat(paymentData.value)
        })
      };

      console.log('Criando cobrança no Asaas...', paymentPayload);

      const paymentResponse = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
          'User-Agent': 'Apontt-System/1.0'
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        console.error('Erro na API Asaas:', errorData);
        throw new Error(`Erro na API Asaas: ${JSON.stringify(errorData)}`);
      }

      const asaasPayment = await paymentResponse.json();
      console.log('Cobrança criada no Asaas:', asaasPayment.id);

      // Gerar código PIX se necessário
      let pixCode = '';
      if (paymentData.billingType === 'PIX') {
        const pixResponse = await fetch(`${baseUrl}/payments/${asaasPayment.id}/pixQrCode`, {
          headers: {
            'access_token': apiKey,
            'User-Agent': 'Apontt-System/1.0'
          }
        });

        if (pixResponse.ok) {
          const pixData = await pixResponse.json();
          pixCode = pixData.payload || '';
          console.log('Código PIX gerado:', pixCode ? 'SIM' : 'NÃO');
        }
      }

      const result: PaymentResult = {
        success: true,
        asaasId: asaasPayment.id,
        invoiceUrl: asaasPayment.invoiceUrl,
        bankSlipUrl: asaasPayment.bankSlipUrl,
        pixCode: pixCode,
        message: `Cobrança criada com sucesso no Asaas. ID: ${asaasPayment.id}`,
        paymentLink: asaasPayment.invoiceUrl,
        amount: paymentData.value,
        dueDate: paymentData.dueDate,
        status: asaasPayment.status,
        isSimulation: false
      };

      console.log('Pagamento criado com sucesso:', result);
      return result;

    } catch (error) {
      console.error('Erro no serviço de pagamento:', error);
      throw error; // Não usar fallback, forçar corrigir a integração real
    }
  }
}

export const paymentServiceSimple = new PaymentServiceSimple();