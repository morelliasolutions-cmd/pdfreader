@echo off
REM Script de build pour Florence-2 Docker image (Windows)

echo 🐳 Construction de l'image Docker Florence-2...

REM Nom de l'image
set IMAGE_NAME=florence-2-runpod
set IMAGE_TAG=latest

REM Vérifier si Docker est installé
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker n'est pas installé. Veuillez installer Docker Desktop d'abord.
    exit /b 1
)

REM Construire l'image
echo 📦 Construction de l'image...
docker build -t %IMAGE_NAME%:%IMAGE_TAG% .

if %ERRORLEVEL% EQU 0 (
    echo ✅ Image construite avec succès: %IMAGE_NAME%:%IMAGE_TAG%
    echo.
    echo 📋 Commandes utiles:
    echo   Tester localement:
    echo     docker run --gpus all -p 8000:8000 %IMAGE_NAME%:%IMAGE_TAG%
    echo.
    echo   Taguer pour GitHub Container Registry:
    echo     docker tag %IMAGE_NAME%:%IMAGE_TAG% ghcr.io/VOTRE_USERNAME/%IMAGE_NAME%:%IMAGE_TAG%
    echo.
    echo   Publier sur GitHub:
    echo     docker push ghcr.io/VOTRE_USERNAME/%IMAGE_NAME%:%IMAGE_TAG%
) else (
    echo ❌ Erreur lors de la construction de l'image
    exit /b 1
)

