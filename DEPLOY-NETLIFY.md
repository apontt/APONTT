# Deploy APONTTPAY no Netlify

## Pré-requisitos

1. Conta no Netlify (https://netlify.com)
2. Repositório Git com o código
3. Chave da API do Asaas

## Passos para Deploy

### 1. Configurar Repositório
```bash
git add .
git commit -m "Configuração para Netlify"
git push origin main
```

### 2. Conectar no Netlify
1. Acesse https://app.netlify.com
2. Clique em "New site from Git"
3. Conecte seu repositório GitHub/GitLab
4. Selecione o repositório APONTTPAY

### 3. Configurações de Build
- **Build command**: `npm run netlify-build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

### 4. Variáveis de Ambiente
No painel do Netlify, vá em Site settings > Environment variables e adicione:

```
NODE_ENV=production
ASAAS_API_KEY=sua_chave_asaas_aqui
ASAAS_ENVIRONMENT=sandbox
ADMIN_PASSWORD=apontt2025!
SESSION_SECRET=sua_chave_secreta_aqui
DATABASE_URL=file:./dev.db
```

### 5. Deploy
1. Clique em "Deploy site"
2. Aguarde o build completar
3. Acesse a URL fornecida pelo Netlify

## Estrutura de URLs

- **Frontend**: `https://seu-site.netlify.app`
- **API**: `https://seu-site.netlify.app/api/*`
- **Health Check**: `https://seu-site.netlify.app/api/health`

## Funcionalidades Disponíveis

✅ **Frontend React**
- Dashboard administrativo
- Gestão de parceiros
- Gestão de contratos
- Gestão de clientes
- Sistema de pagamentos

✅ **API Backend**
- Todas as rotas da API
- Integração com Asaas
- Banco de dados SQLite
- Sistema de autenticação

✅ **Recursos Especiais**
- Assinatura digital de contratos
- Geração de PIX
- Dashboard de parceiros
- Relatórios e métricas

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no package.json
- Confirme se o comando de build está correto

### Erro de Função
- Verifique os logs no painel do Netlify
- Confirme se as variáveis de ambiente estão configuradas

### Erro de Banco
- O banco SQLite é criado automaticamente
- Verifique se o arquivo dev.db está sendo copiado

## Monitoramento

- **Logs**: Painel do Netlify > Functions > View logs
- **Analytics**: Painel do Netlify > Analytics
- **Performance**: Lighthouse integrado

## Atualizações

Para atualizar o site:
1. Faça push das alterações para o repositório
2. O Netlify fará deploy automático
3. Verifique o status no painel

## Suporte

- Documentação Netlify: https://docs.netlify.com
- Suporte Asaas: https://asaas.com/suporte