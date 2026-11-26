@echo off
echo ========================================================
echo   Starting CivicFix Backend (FastAPI + AI Engine)...
echo ========================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python run.py
) else (
    python run.py
)
pause
