@echo off
echo Starting AI Music Video Application Suite...
echo ================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo Starting Docker services...
docker-compose up -d

echo Waiting for Docker services to initialize...
timeout /t 10 /nobreak >nul

echo Starting Backend Server...
cd server
set PORT=3002
start "Backend Server" cmd /k "npm start"
cd ..

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend Application...
start "Frontend App" cmd /k "npm run dev"

echo Starting StitchStream Studio (port 4100)...
cd stitchstream
start "StitchStream Studio" cmd /k "npm run dev -- --host --port 4100"
cd ..

echo.
echo All services started!
echo.
echo Access Points:
echo    Main App: http://localhost:4001
echo    ComfyUI: http://localhost:8188
echo    Backend API: http://localhost:3002
echo    Automatic1111: http://localhost:7860
echo    StitchStream: http://localhost:4100
echo    n8n: http://localhost:5678
echo.
echo To stop all services:
echo    docker-compose down
echo    Close the backend, frontend, and StitchStream terminal windows
echo.
pause
