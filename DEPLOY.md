# 🚀 Instruções de Deploy - APONTTPAY

## ✅ Deploy Finalizado

### 📋 Pré-requisitos
- Conta no GitHub
- Repositório público ou privado
- GitHub Pages habilitado

### 🔧 Configuração Automática
1. **Push para main** - Deploy automático via GitHub Actions
2. **URL do sistema**: `https://seuusuario.github.io/APTT`
3. **Workflow**: `.github/workflows/deploy.yml`

### 🎯 Passos para Deploy
1. Faça commit das alterações
2. Push para branch `main`
3. GitHub Actions executará automaticamente
4. Sistema estará disponível em minutos

### ⚙️ Configurações
- **Jekyll**: Configurado via `_config.yml`
- **Node.js**: Versão 18+ (definido no workflow)
- **Dependencies**: Instalação automática via npm

### 🔍 Monitoramento
- Verifique a aba "Actions" no GitHub
- Logs completos de deploy disponíveis
- Status em tempo real do processo