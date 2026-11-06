@echo off
title Strike House - Gestao de Academia de Lutas
cd /d %~dp0

:: Tentar caminhos comuns do Node.js se nao estiver no PATH global
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
    if exist "%ProgramFiles(x86)%\nodejs" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    if exist "C:\Users\TI-4817\AppData\Local\Programs\nodejs" set "PATH=C:\Users\TI-4817\AppData\Local\Programs\nodejs;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ========================================================
    echo ERRO: Node.js nao foi detectado neste computador!
    echo ========================================================
    echo Para executar o Strike House, e necessario instalar o Node.js.
    echo Baixe e instale a versao LTS gratuitamente em:
    echo   https://nodejs.org/
    echo Apos instalar, execute este arquivo novamente.
    echo ========================================================
    pause
    exit /b 1
)

echo ===================================================
echo         INICIANDO STRIKE HOUSE ENTERPRISE          
echo    Sistema de Gestao para Academia de Lutas       
echo ===================================================
echo Acesse no navegador: http://localhost:3000
echo Credenciais padrao: admin@strikehouse.com / admin123
echo Pressione Ctrl+C para encerrar o servico.
echo ===================================================

:: Criar .env se nao existir
if not exist ".env" (
    echo [Setup] Criando arquivo .env a partir de .env.example...
    copy .env.example .env >nul
)

:: Instalar dependencias se a pasta node_modules nao existir
if not exist "node_modules\" (
    echo [Setup] Instalando dependencias do projeto (npm install)...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [Erro] Falha ao instalar dependencias com npm.
        pause
        exit /b 1
    )
)

:: Compilar o sistema se dist nao existir
if not exist "dist\server.js" (
    echo [Build] Compilando sistema pela primeira vez...
    call npm.cmd run build
    if %errorlevel% neq 0 (
        echo [Erro] Falha na compilacao com npm run build.
        pause
        exit /b 1
    )
)

if not exist "dist\public\index.html" (
    echo [Build] Compilando frontend SPA...
    call npm.cmd run build:client
)

:: Abrir navegador automaticamente em segundo plano
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

node dist/server.js
pause
