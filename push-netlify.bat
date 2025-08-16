@echo off
echo 🚀 Fazendo push final para Netlify...

echo.
echo 📦 Adicionando arquivos...
git add .

echo.
echo 💾 Fazendo commit...
git commit -m "Configuracao final para Netlify - projeto completo"

echo.
echo 🌐 Enviando para GitHub...
git push origin main

echo.
echo ✅ Push concluído!
echo.
echo 📋 Próximos passos:
echo 1. Acesse https://app.netlify.com
echo 2. Verifique o build em Deploys
echo 3. Configure as variáveis de ambiente
echo 4. Teste o site após o deploy
echo.
pause