# 🚀 Deploy APONTTPAY no Render

## 📋 Passo a Passo

### 1. **Preparar o Repositório**
```bash
# Inicializar Git (se não existir)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Deploy inicial APONTTPAY"

# Conectar ao GitHub/GitLab
git remote add origin https://github.com/SEU_USUARIO/aponttpay.git
git push -u origin main
```

### 2. **Criar Conta no Render**
- Acesse: https://render.com
- Faça login com GitHub/GitLab
- Conecte seu repositório

### 3. **Configurar Web Service**
- Clique em "New +" → "Web Service"
- Conecte seu repositório GitHub
- Configure:
  - **Name**: aponttpay
  - **Environment**: Node
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm start`
  - **Instance Type**: Free (ou pago conforme necessário)

### 4. **Configurar Variáveis de Ambiente**
No painel do Render, adicione:
```
NODE_ENV=production
DATABASE_URL=file:./dev.db
SESSION_SECRET=sua-chave-secreta-aqui
ADMIN_PASSWORD=apontt2025!
ASAAS_API_KEY=926aa7e8-78f4-44ea-b782-ba70a68c96fe
```

### 5. **Deploy Automático**
- O Render fará o deploy automaticamente
- Aguarde o build completar (5-10 minutos)
- Acesse a URL fornecida pelo Render

## ⚙️ Configurações Importantes

### Scripts do package.json
Certifique-se que existem:
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "dev": "set NODE_ENV=development && tsx server/index.ts"
  }
}
```

### Banco de Dados
- SQLite será criado automaticamente
- Para produção, considere PostgreSQL do Render

## 🔧 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no package.json
- Confirme se o script "build" existe

### Erro de Start
- Verifique se o arquivo dist/index.js foi criado
- Confirme se a porta está configurada corretamente

### Banco de Dados
- SQLite funciona no Render, mas dados são perdidos em redeploys
- Para persistência, use PostgreSQL do Render

## 🌐 Acesso Final
Após o deploy:
- URL: https://aponttpay.onrender.com (ou similar)
- Admin: apontt2025!
- API: https://aponttpay.onrender.com/api

## 📞 Suporte
Deploy configurado e pronto para produção!