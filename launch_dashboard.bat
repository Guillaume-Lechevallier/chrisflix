@echo off
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

rem Start the Flask server in a new window
start "" python -m worldometer_app.app

rem Give the server a moment to start then open Firefox
timeout /t 5 > NUL
start "" firefox http://localhost:5000/
