@echo off
cd /d "%~dp0"
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║   AI AGENT FACTORY — Corso            ║
echo  ║   Avvio server locale...              ║
echo  ╚═══════════════════════════════════════╝
echo.
echo  Apri il browser su: http://localhost:8080
echo  Premi CTRL+C per fermare il server.
echo.
start "" "http://localhost:8080"
python -m http.server 8080
