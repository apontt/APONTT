import { execSync } from 'child_process';

console.log('🚀 Build Netlify...');

try {
  execSync('npm run build:client', { stdio: 'inherit' });
  console.log('✅ Build OK!');
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}