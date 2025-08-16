@echo off
echo Iniciando APONTTPAY...
echo.

echo Instalando dependencias...
call npm install

echo.
echo Iniciando servidor em modo desenvolvimento...
call npm run dev

pause