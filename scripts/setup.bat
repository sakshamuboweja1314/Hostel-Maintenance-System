@echo off
echo =====================================================================
echo  Edge-Based Hostel Maintenance Complaint Prioritization System
echo  Environment Setup Script (Windows)
echo =====================================================================

cd /d "%~dp0\.."

echo [1/3] Checking Python installation...
python --version
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.11+.
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Python dependencies from backend/requirements.txt...
python -m pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

echo.
echo [3/3] Installing Node.js frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    exit /b 1
)
cd ..

echo.
echo =====================================================================
echo  Setup Completed Successfully!
echo  Next steps:
echo    - Run scripts\train_models.bat if you want to re-train models.
echo    - Run scripts\start_project.bat to launch the application.
echo =====================================================================
pause
