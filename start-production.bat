@echo off
echo ========================================
echo    APONTTPAY - MODO PRODUCAO
echo ========================================
echo.

echo [1/3] Fazendo build do projeto...
call npm run build
if %errorlevel% neq 0 (
    echo Erro no build do projeto
    pause
    exit /b 1
)

echo.
echo [2/3] Configurando ambiente de producao...
set NODE_ENV=production

echo.
echo [3/3] Iniciando em modo producao...
echo.
echo ========================================
echo    PROJETO RODANDO EM PRODUCAO!
echo    
echo    Acesse: http://localhost:5000
echo    
echo    Para parar: Ctrl+C
echo ========================================
echo.

call npm start