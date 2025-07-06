@echo off
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python -m worldometer_app.app
