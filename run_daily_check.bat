@echo off
cd /d "x:\Saisonalitäten Auswertung\backend"
echo Starte FX Analyse...
call .venv\Scripts\activate.bat
python daily_news_index.py
echo Fertig!
pause
