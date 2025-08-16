@echo off
echo ========================================
echo     DEPLOY APONTTPAY - AUTOMATICO
echo ========================================
echo.

echo 1. Fazendo push para GitHub...
git branch -M main
git push -u origin main --force

echo.
echo ========================================
echo     ACESSE AGORA:
echo ========================================
echo.
echo 1. https://app.netlify.com
echo 2. Clique: "New site from Git"
echo 3. Conecte GitHub
echo 4. Selecione: apontt/Apontt
echo 5. Configure:
echo    Build command: npm run netlify-build
echo    Publish directory: dist/public
echo 6. Deploy!
echo.
echo ========================================
echo     VARIAVEIS DE AMBIENTE OBRIGATORIAS:
echo ========================================
echo.
echo NODE_ENV=production
echo ASAAS_API_KEY=sua_chave_asaas
echo ASAAS_ENVIRONMENT=sandbox
echo ADMIN_PASSWORD=apontt2025!
echo SESSION_SECRET=chave123
echo DATABASE_URL=file:./dev.db
echo.
echo ========================================
echo     SITE FUNCIONANDO EM 5 MINUTOS!
echo ========================================
pause