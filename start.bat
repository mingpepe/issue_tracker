@echo off
echo ===================================================
echo   Starting TaskPulse (Issue Tracker)...
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Check and install dependencies if they are missing
if not exist "node_modules" (
    echo [1/4] Installing root dependencies...
    call npm install --no-audit --no-fund
)

if not exist "server\node_modules" (
    echo [2/4] Installing server dependencies...
    cd server
    call npm install --no-audit --no-fund
    cd ..
)

if not exist "client\node_modules" (
    echo [3/4] Installing client dependencies...
    cd client
    call npm install --no-audit --no-fund
    cd ..
)

echo [4/4] Starting servers...
echo.
echo Application will open in your browser shortly at: http://localhost:4173
echo To close the application, simply close this command window.
echo ---------------------------------------------------
echo.

:: Launch the app
call npm run preview
pause
