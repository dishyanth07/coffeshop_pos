@echo off
cd /d "c:\Users\dishy\OneDrive\Desktop\coffeshop_pos\backend"
venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug > uvicorn_fresh.log 2>&1
pause
