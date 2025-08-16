import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Em ESM, __dirname não existe — precisamos recriar:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando build para Netlify...');

try {
  // 1. Build do cliente (frontend)
  console.log('📦 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Copiar arquivos necessários para as funções
  console.log('📁 Copiando arquivos para funções...');
  
  // Criar diretório se não existir
  const functionsDir = path.join(__dirname, 'netlify', 'functions');
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  // Copiar banco de dados se existir
  const dbPath = path.join(__dirname, 'dev.db');
  const dbDestPath = path.join(functionsDir, 'dev.db');
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, dbDestPath);
    console.log('✅ Banco de dados copiado');
  }

  // Copiar arquivo .env se existir
  const envPath = path.join(__dirname, '.env');
  const envDestPath = path.join(functionsDir, '.env');
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, envDestPath);
    console.log('✅ Arquivo .env copiado');
  }

  console.log('✅ Build para Netlify concluído com sucesso!');
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
