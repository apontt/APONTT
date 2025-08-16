@echo off
echo ========================================
echo    APONTTPAY - Iniciando em Desenvolvimento
echo ========================================
echo.

set NODE_ENV=development
echo Definindo NODE_ENV=%NODE_ENV%
echo.

echo Iniciando servidor...
echo Acesse: http://localhost:5000
echo.

tsx server/index.ts