@echo off
echo ========================================
echo FYP Buddy AI Chatbot Setup
echo ========================================
echo.

echo Step 1: Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)
echo ✓ Python is installed
echo.

echo Step 2: Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo Step 3: Checking .env configuration...
if exist .env (
    echo ✓ .env file exists
    findstr /C:"GEMINI_API_KEY" .env >nul
    if %errorlevel% equ 0 (
        echo ✓ GEMINI_API_KEY is configured
    ) else (
        echo WARNING: GEMINI_API_KEY not found in .env
        echo Please add your Gemini API key to .env file
    )
) else (
    echo WARNING: .env file not found
    echo Please create .env file and add your GEMINI_API_KEY
)
echo.

echo Step 4: Testing chatbot backend...
echo Testing Python chatbot (press Ctrl+C after 3 seconds)...
timeout /t 3 /nobreak >nul
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start your backend: cd ..\..\backend ^&^& npm run dev
echo 2. Start your frontend: cd ..\..\frontend ^&^& npm run dev
echo 3. Access chatbot at: http://localhost:5173/student/chatbot
echo.
echo Note: Run this script from backend/Chatbot directory
echo.
pause
