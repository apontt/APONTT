@echo off
echo ========================================
echo.
echo    APONTTPAY - MODO DESENVOLVIMENTO
echo ========================================
echo.

echo [1/2] Configurando ambiente...
set NODE_ENV=development

echo.
echo [2/2] Iniciando servidor...
echo.
echo ========================================
echo.
echo    PROJETO RODANDO!
echo.
echo    Acesse: http://localhost:5000
echo.
echo    Para parar: Ctrl+C
echo ========================================
echo.

cd /d "%~dp0"
npm run dev