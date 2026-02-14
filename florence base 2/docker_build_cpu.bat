@echo off
REM Script pour construire et tester l'image Docker CPU
echo ============================================================
echo Construction de l'image Docker Florence-2 (CPU)
echo ============================================================
echo.

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas installe ou n'est pas en cours d'execution
    echo Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker detecte
echo.

REM Construire l'image
echo Construction de l'image (cela peut prendre quelques minutes)...
docker build -f Dockerfile.cpu -t florence2-base-local .

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Echec de la construction
    pause
    exit /b 1
)

echo.
echo [OK] Image construite avec succes
echo.

REM Proposer de lancer le test
echo Voulez-vous lancer le test maintenant? (O/N)
set /p choice="> "

if /i "%choice%"=="O" (
    echo.
    echo Lancement du conteneur...
    echo.
    docker run --rm florence2-base-local
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERREUR] Le test a echoue
        pause
        exit /b 1
    )
)

echo.
echo ============================================================
echo Image prete!
echo.
echo Pour lancer le test:
echo   docker run --rm florence2-base-local
echo.
echo Pour utiliser votre propre image:
echo   docker run --rm -v %cd%\mon_image.jpg:/app/test.jpg florence2-base-local
echo ============================================================
pause
