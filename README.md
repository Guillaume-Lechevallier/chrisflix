# ChrisFlix

Simple video browser that serves files from a directory of your choice.
Set the `VIDEO_DIR` environment variable to override the default Windows path
`F:\Films\` used in the original setup.

## Backend

Run the backend with Flask:

```bash
pip install -r backend/requirements.txt
VIDEO_DIR=/path/to/videos python backend/server.py
```

## Frontend

The frontend is a very small JavaScript application served statically by Flask. It lists directories and files and plays videos in the browser.

Because the environment does not allow network access, a full Angular setup is not provided.
