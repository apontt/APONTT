// Validador para chaves de API do Asaas
export function validateAsaasApiKey(): { isValid: boolean; message: string; environment: 'sandbox' | 'production' | 'unknown' } {
  const apiKey = process.env.ASAAS_API_KEY;
  
  if (!apiKey) {
    return {
      isValid: false,
      message: 'Chave de API do Asaas não configurada. Configure ASAAS_API_KEY nas variáveis de ambiente.',
      environment: 'unknown'
    };
  }
  
  // Verificar se é uma chave de homologação (sandbox)
  if (apiKey.startsWith('$aact_hmlg')) {
    return {
      isValid: true,
      message: 'Chave de API sandbox do Asaas configurada e válida.',
      environment: 'sandbox'
    };
  }
  
  // Verificar se é uma chave de produção
  if (apiKey.startsWith('$aact_') && !apiKey.startsWith('$aact_hmlg')) {
    return {
      isValid: true,
      message: 'Chave de API de produção do Asaas configurada.',
      environment: 'production'
    };
  }
  
  // Verificar formato UUID (também pode ser sandbox dependendo da conta)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey)) {
    return {
      isValid: true,
      message: 'Chave de API formato UUID configurada (sandbox).',
      environment: 'sandbox'
    };
  }
  
  return {
    isValid: false,
    message: 'Chave de API do Asaas inválida. Deve começar com $aact_ ou ser um UUID válido',
    environment: 'unknown'
  };
}

export function getAsaasConfig() {
  const apiKey = process.env.ASAAS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Chave API do Asaas não configurada');
  }
  
  // Detectar automaticamente o ambiente
  let isSandbox = false;
  let environment = 'production';
  
  if (apiKey.startsWith('$aact_hmlg')) {
    isSandbox = true;
    environment = 'sandbox';
  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey)) {
    isSandbox = true;
    environment = 'sandbox';
  }
  
  return {
    url: isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3',
    apiKey: apiKey,
    isSandbox: isSandbox,
    environment: environment
  };
}