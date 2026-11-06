@echo off
title Strike House - Push para GitHub
cd /d %~dp0

echo ========================================================
echo        ENVIANDO STRIKE HOUSE PARA O GITHUB
echo ========================================================
echo Destino: https://github.com/MatheusANDLucca/strike-house.git
echo Ramo:    main
echo ========================================================
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCESSO: Projeto enviado com sucesso para o GitHub!
    echo Acesse: https://github.com/MatheusANDLucca/strike-house
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo AVISO: Se o erro for "Repository not found", certifique-se
    echo de ter criado o repositorio vazio "strike-house" no seu GitHub:
    echo   https://github.com/new
    echo.
    echo Nome do repositorio: strike-house
    echo Deixe DESMARCADO "Add a README file" (pois ja temos um)
    echo Apos criar no site, execute este push_to_github.bat novamente!
    echo ========================================================
)

pause
