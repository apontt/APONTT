import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando build para Netlify...');

try {
  // 1. Build do cliente
  console.log('📦 Building frontend...');
  execSync('npm run build:client', { stdio: 'inherit' });

  // 2. Criar diretórios necessários
  const functionsDir = path.join(__dirname, 'netlify', 'functions');
  const distDir = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  // 3. Copiar banco de dados
  const dbPath = path.join(__dirname, 'dev.db');
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, path.join(distDir, 'dev.db'));
    console.log('✅ Banco copiado');
  }

  console.log('✅ Build concluído!');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}