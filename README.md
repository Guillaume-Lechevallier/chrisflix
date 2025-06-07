# ChrisFlix

Simple video browser that serves files from a directory of your choice.
Set the `VIDEO_DIR` environment variable to override the default Windows path
`F:\Films\` used in the original setup.

Supported video formats include **MP4**, **MKV**, **AVI**, and **MOV**.
Most browsers do not natively play Matroska files. When `ffmpeg` is available on
the system, the server can transcode `.mkv` files to MP4 on the fly so they play
in the browser.

For transcoding to work you must have the **ffmpeg** executable installed and
accessible in your `PATH`. On Windows, download a static build from the
[official website](https://ffmpeg.org/download.html) and add the `bin` directory
to your environment variables.

## Backend

Run the backend with Flask:

```bash
pip install -r backend/requirements.txt
VIDEO_DIR=/path/to/videos python backend/server.py
```

## Frontend

The frontend is a very small JavaScript application served statically by Flask. It lists directories and files and plays videos in the browser.

Because the environment does not allow network access, a full Angular setup is not provided.
