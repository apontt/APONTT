// Teste simples da API ASAAS
require('dotenv').config();

async function testAsaasAPI() {
  const apiKey = process.env.ASAAS_API_KEY;
  
  console.log('🔍 Testando conexão com API ASAAS...');
  console.log(`🔑 Chave API: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NÃO CONFIGURADA'}`);
  
  if (!apiKey) {
    console.log('❌ Chave API não configurada!');
    return;
  }
  
  // Detectar ambiente baseado na chave
  const isSandbox = apiKey.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || apiKey.startsWith('$aact_hmlg');
  const baseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';
  
  console.log(`🌍 Ambiente: ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
  console.log(`🔗 URL: ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'Apontt-System/1.0'
      }
    });
    
    console.log(`📡 Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
      console.log(`👤 Nome da conta: ${data.name || 'N/A'}`);
      console.log(`📧 Email: ${data.email || 'N/A'}`);
      console.log(`🆔 ID da conta: ${data.id || 'N/A'}`);
      return { success: true, data };
    } else {
      const errorData = await response.json();
      console.log('❌ FALHA NA CONEXÃO');
      console.log(`💬 Erro: ${errorData.errors?.[0]?.description || errorData.message || 'Erro desconhecido'}`);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.log('❌ ERRO DE CONECTIVIDADE');
    console.log(`💬 Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Executar teste
testAsaasAPI().then(result => {
  console.log('\n📊 RESULTADO FINAL:', result.success ? 'SUCESSO' : 'FALHOU');
  process.exit(result.success ? 0 : 1);
});