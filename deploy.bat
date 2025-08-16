@echo off
echo 🚀 Iniciando deploy do APONTTPAY...

echo 📦 Instalando Vercel CLI...
npm install -g vercel

echo 🔧 Fazendo build do projeto...
npm run build

echo 🌐 Fazendo deploy...
vercel --prod

echo ✅ Deploy concluído!
echo 🔗 Seu link público será exibido acima
pause