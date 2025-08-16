# 🚀 GUIA SIMPLES - DEPLOY NETLIFY

## PASSO 1: Execute o Script
```bash
deploy-automatico.bat
```

## PASSO 2: Acesse o Netlify
1. Vá para: https://app.netlify.com
2. Faça login com GitHub
3. Clique: **"New site from Git"**

## PASSO 3: Conectar Repositório
1. Clique: **"GitHub"**
2. Procure: **"apontt/Apontt"**
3. Clique no repositório

## PASSO 4: Configurar Build
1. **Build command**: `npm run netlify-build`
2. **Publish directory**: `dist`
3. Clique: **"Deploy site"**

## PASSO 5: Variáveis de Ambiente
1. Vá em: **Site settings**
2. Clique: **Environment variables**
3. Adicione cada uma:

```
NODE_ENV = production
ASAAS_API_KEY = sua_chave_asaas_aqui
ASAAS_ENVIRONMENT = sandbox
ADMIN_PASSWORD = apontt2025!
SESSION_SECRET = chave_secreta_123
DATABASE_URL = file:./dev.db
```

## PASSO 6: Aguardar Deploy
- ⏱️ Tempo: 3-5 minutos
- ✅ Status: "Published"
- 🌐 URL: Será mostrada no painel

## ✅ PRONTO!
Seu site estará online em: `https://seu-site.netlify.app`

## 🆘 PROBLEMAS?
- Build falhou: Verifique as variáveis de ambiente
- Site não carrega: Aguarde alguns minutos
- API não funciona: Verifique ASAAS_API_KEY

## 📞 SUPORTE
- Logs: Painel Netlify > Functions > View logs
- Status: Painel Netlify > Deploys