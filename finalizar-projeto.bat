@echo off
echo ========================================
echo    APONTTPAY - FINALIZACAO DO PROJETO
echo ========================================
echo.

echo [1/6] Limpando cache do npm...
call npm cache clean --force

echo.
echo [2/6] Instalando dependencias principais...
call npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias principais
    pause
    exit /b 1
)

echo.
echo [3/6] Instalando dependencias do cliente...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias do cliente
    cd ..
    pause
    exit /b 1
)

echo.
echo [4/6] Instalando dependencias do servidor...
cd ..\server
call npm install
if %errorlevel% neq 0 (
    echo Erro na instalacao das dependencias do servidor
    cd ..
    pause
    exit /b 1
)

echo.
echo [5/6] Configurando banco de dados...
cd ..
if not exist "dev.db" (
    echo Criando banco de dados SQLite...
    echo. > dev.db
)

echo.
echo [6/6] Iniciando projeto em modo desenvolvimento...
echo.
echo ========================================
echo    PROJETO FINALIZADO E RODANDO!
echo    
echo    Acesse: http://localhost:5000
echo    
echo    Para parar: Ctrl+C
echo ========================================
echo.

call npm run dev