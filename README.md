# ChrisFlix

Simple video browser that serves files from a directory of your choice.
Set the `VIDEO_DIR` environment variable to override the default Windows path
`F:\Films\` used in the original setup.

Supported video formats include **MP4**, **MKV**, **AVI**, and **MOV**.
Most browsers do not natively play Matroska or AVI files. When `ffmpeg` is available on
the system, the server can transcode `.mkv` and `.avi` files to MP4 on the fly so they play
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

## World Population Dashboard

This project also includes a small Flask dashboard that scrapes live demographic data from [Worldometer](https://www.worldometers.info/).

### Running

```bash
pip install -r requirements.txt
python -m worldometer_app.app
```

Select one or more countries on the page to display their current population statistics. A world map lets you click any country to fetch its data in real time.
