# Repository Guidelines

- Run `pytest` before committing changes to ensure scraper tests pass.
- The worldometer dashboard lives under `worldometer_app/`. Start it with
  `python -m worldometer_app.app` or use `launch_dashboard.bat` on Windows.
  The batch file now opens Firefox automatically after launching the server.
- The video browser server can be started with `python backend/server.py` or `launch_backend.bat` on Windows.
- Dependencies are listed in `requirements.txt`. Use this file for setup.
