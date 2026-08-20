@echo off
TITLE DeepVision Local Development Server
echo ===================================================
echo   Starting DeepVision on Localhost
echo   - Backend:  http://localhost:8000 (Docs: /docs)
echo   - Frontend: http://localhost:5173
echo ===================================================

echo [1/2] Launching FastAPI Backend on port 8000...
start "DeepVision Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo [2/2] Launching React Vite Frontend on port 5173...
start "DeepVision Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched!
echo Open your browser at: http://localhost:5173
pause
