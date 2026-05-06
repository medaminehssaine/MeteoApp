@echo off
echo ============================================
echo    Meteo Projet - Starting Up...
echo ============================================
echo.

docker compose up -d --build

echo.
echo ============================================
echo    Meteo Projet is running!
echo ============================================
echo.
echo   Frontend:  http://localhost
echo   Backend:   http://localhost:8080
echo   Swagger:   http://localhost:8080/swagger-ui.html
echo   AI Engine: Groq/OpenAI-compatible endpoint via GROQ_API_KEY
echo.
echo   Admin Login:
echo     Use the seeded admin account from your local/private setup notes.
echo.
echo ============================================
pause
