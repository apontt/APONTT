@echo off
echo ========================================
echo      DEPLOY APONTTPAY NO RENDER
echo ========================================
echo.

echo 1. Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Git nao encontrado. Instale o Git primeiro.
    pause
    exit /b 1
)

echo 2. Inicializando repositorio Git...
if not exist .git (
    git init
    echo Repositorio Git inicializado.
) else (
    echo Repositorio Git ja existe.
)

echo.
echo 3. Adicionando arquivos...
git add .

echo.
echo 4. Fazendo commit...
git commit -m "Deploy APONTTPAY para Render"

echo.
echo 5. PROXIMO PASSO MANUAL:
echo    - Va para https://github.com e crie um novo repositorio
echo    - Nome sugerido: aponttpay
echo    - Execute os comandos que o GitHub mostrar:
echo.
echo    git remote add origin https://github.com/SEU_USUARIO/aponttpay.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 6. DEPOIS NO RENDER:
echo    - Acesse https://render.com
echo    - Clique em "New +" e "Web Service"
echo    - Conecte seu repositorio GitHub
echo    - Use as configuracoes do arquivo DEPLOY-RENDER.md
echo.
echo ========================================
echo Deploy preparado! Siga os proximos passos manuais.
pause