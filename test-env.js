// Teste das variáveis de ambiente
import { config } from 'dotenv';
config();

console.log('ASAAS_API_KEY:', process.env.ASAAS_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);