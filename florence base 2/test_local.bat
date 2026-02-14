@echo off
REM Script de test rapide pour Florence-2 local (Windows)
echo ============================================================
echo Test Florence-2-base en local
echo ============================================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH
    pause
    exit /b 1
)

echo [OK] Python detecte
echo.

REM Installer les dépendances si nécessaire
echo Verification des dependances...
pip show transformers >nul 2>&1
if %errorlevel% neq 0 (
    echo Installation des dependances...
    pip install transformers torch torchvision pillow einops timm requests
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec installation des dependances
        pause
        exit /b 1
    )
)

echo [OK] Dependances presentes
echo.

REM Lancer le test
echo Lancement du test Florence-2...
echo.
python app.py

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le test a echoue
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Test termine avec succes!
echo ============================================================
pause
