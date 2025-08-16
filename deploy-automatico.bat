@echo off
echo ========================================
echo     DEPLOY AUTOMATICO NETLIFY
echo ========================================
echo.

echo 1. Inicializando Git...
git init
git remote remove origin 2>nul
git remote add origin https://github.com/apontt/Apontt.git

echo.
echo 2. Adicionando arquivos...
git add .

echo.
echo 3. Fazendo commit...
git commit -m "Deploy APONTTPAY - Sistema completo"

echo.
echo 4. Enviando para GitHub...
git branch -M main
git push -u origin main --force

echo.
echo ========================================
echo     PROXIMO PASSO: NETLIFY
echo ========================================
echo.
echo 1. Acesse: https://app.netlify.com
echo 2. Clique: "New site from Git"
echo 3. Conecte GitHub
echo 4. Selecione: apontt/Apontt
echo 5. Configuracoes:
echo    - Build command: npm run netlify-build
echo    - Publish directory: dist
echo 6. Clique: Deploy site
echo.
echo ========================================
echo     VARIAVEIS DE AMBIENTE
echo ========================================
echo.
echo No painel Netlify, adicione:
echo.
echo NODE_ENV=production
echo ASAAS_API_KEY=sua_chave_asaas
echo ASAAS_ENVIRONMENT=sandbox
echo ADMIN_PASSWORD=apontt2025!
echo SESSION_SECRET=chave123
echo DATABASE_URL=file:./dev.db
echo.
echo ========================================
echo     DEPLOY CONCLUIDO!
echo ========================================
pause