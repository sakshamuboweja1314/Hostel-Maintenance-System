@echo off
echo =====================================================================
echo  Starting Edge-Based Hostel Maintenance Complaint Prioritization System
echo =====================================================================

cd /d "%~dp0\.."

echo.
echo [1/3] Ensuring SQLite database is initialized...
python -m backend.app.seed

echo.
echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Hostel NLP Backend (FastAPI)" cmd /k "cd /d \"%~dp0\..\" && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Launching React Vite Frontend on http://localhost:5173 ...
start "Hostel NLP Frontend (Vite)" cmd /k "cd /d \"%~dp0\..\frontend\" && npm run dev"

echo.
echo =====================================================================
echo  Both services launched in separate windows!
echo  - Backend API:   http://127.0.0.1:8000
echo  - Swagger Docs:  http://127.0.0.1:8000/docs
echo  - Frontend Web:  http://localhost:5173
echo =====================================================================
timeout /t 3 >nul
start http://localhost:5173
