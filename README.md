# ChrisFlix

Simple video browser that serves files from the directory `F:\Films\`.

## Backend

Run the backend with Flask:

```bash
pip install -r backend/requirements.txt
python backend/server.py
```

## Frontend

The frontend is a very small JavaScript application served statically by Flask. It lists directories and files and plays videos in the browser.

Because the environment does not allow network access, a full Angular setup is not provided.
