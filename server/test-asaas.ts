// Teste rápido da conexão Asaas
import { asaasService } from './asaas-service';

export async function testAsaasConnection() {
  console.log('🔍 Testando conexão com Asaas...');
  
  const result = await asaasService.validateConnection();
  
  console.log(`✅ Resultado: ${result.valid ? 'CONECTADO' : 'FALHOU'}`);
  console.log(`📍 Ambiente: ${result.environment}`);
  console.log(`💬 Mensagem: ${result.message}`);
  
  return result;
}