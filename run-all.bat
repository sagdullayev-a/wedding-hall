@echo off
echo ===================================================
echo   Wedding Hall Booking - Client ^& Server Runner
echo ===================================================
echo.
echo Starting Backend Express Server on Port 5000...
start cmd /k "title Backend Server (Port 5000) && cd server && npm run dev"
echo.
echo Starting Frontend Next.js Client on Port 3000...
start cmd /k "title Frontend Client (Port 3000) && cd client && npm run dev"
echo.
echo ===================================================
echo   Success! Both services are launching in separate windows.
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo ===================================================
pause
