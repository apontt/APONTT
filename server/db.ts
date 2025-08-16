import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';

// Configurar conexão PostgreSQL
const sql = postgres(env.DATABASE_URL, {
  ssl: env.NODE_ENV === 'production' ? 'require' : 'prefer',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql);

// Inicializar conexão
try {
  console.log('✅ Conexão PostgreSQL configurada com sucesso');
} catch (error) {
  console.error('❌ Erro ao conectar com PostgreSQL:', error);
}