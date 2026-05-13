@echo off
REM Development Tunnel Script for Next.js using Cloudflare Tunnel
REM This script starts the dev server and creates a public tunnel
REM
REM Usage: npm run share
REM Or:   scripts\share.bat

TITLE Next.js Development Tunnel

echo.
echo ========================================
echo   Next.js Development Tunnel
echo ========================================
echo.

REM Check if node is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the tunnel script
node scripts\dev-tunnel.js

REM If the script exits with error, pause to show the message
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Tunnel setup failed. Press any key to exit...
    pause >nul
    exit /b 1
)
