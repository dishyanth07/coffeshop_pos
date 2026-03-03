@echo off
echo Killing old processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Backend Server...
cd backend
start cmd /k "venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
cd frontend
start cmd /k "npm run dev"
cd ..

echo.
echo Servers starting...
echo Backend: http://localhost:8000
echo Frontend: Check the frontend terminal for the actual port (likely 5173)
echo.
pause
