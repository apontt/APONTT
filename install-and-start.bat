@echo off
echo ========================================
echo    APONTTPAY - Instalacao e Inicializacao
echo ========================================
echo.

echo [1/4] Instalando dependencias principais...
call npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias principais
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando dependencias do cliente...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias do cliente
    pause
    exit /b 1
)

echo.
echo [3/4] Instalando dependencias do servidor...
cd ..\server
call npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias do servidor
    pause
    exit /b 1
)

echo.
echo [4/4] Iniciando o projeto...
cd ..
echo.
echo ========================================
echo    Projeto iniciando na porta 5000
echo    Acesse: http://localhost:5000
echo ========================================
echo.

call npm run dev