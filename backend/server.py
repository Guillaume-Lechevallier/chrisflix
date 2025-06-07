"""Minimal Flask backend powering the ChrisFlix video browser."""

import os
import mimetypes
import shutil
from pathlib import Path
from flask import (
    Flask,
    jsonify,
    send_from_directory,
    abort,
    request,
    Response,
    stream_with_context,
)
import subprocess
import sqlite3
from datetime import datetime

# Directory containing the video files. Configure via the ``VIDEO_DIR``
# environment variable. It defaults to the Windows path used in the
# initial project so that existing setups keep working.
VIDEO_DIR = os.environ.get("VIDEO_DIR", r"F:\\Films\\")

DB_PATH = os.path.join(os.path.dirname(__file__), "comments.db")

app = Flask(__name__, static_folder="../frontend", static_url_path="")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video TEXT,
        username TEXT,
        comment TEXT,
        rating INTEGER,
        timestamp TEXT
    )"""
    )
    conn.commit()
    conn.close()


init_db()

# Ensure common video formats have a MIME type even on minimal installs
mimetypes.add_type("video/x-matroska", ".mkv")
mimetypes.add_type("video/x-msvideo", ".avi")

ALLOWED_EXTENSIONS = {"mp4", "mkv", "avi", "mov"}


def safe_join(base: str, *paths: str) -> str:
    """Safely join one or more path components to *base*.

    Raises a 404 error if the resulting path escapes the base directory.
    """
    base_path = Path(base).resolve()
    new_path = (base_path / Path(*paths)).resolve()
    if not str(new_path).startswith(str(base_path)):
        abort(404)
    return str(new_path)


@app.route("/")
def index():
    """Serve the frontend application."""
    return app.send_static_file("index.html")


@app.route("/api/list", defaults={"path": ""})
@app.route("/api/list/<path:path>")
def list_videos(path: str):
    """Return directory contents as JSON."""
    target_dir = safe_join(VIDEO_DIR, path)
    if not os.path.isdir(target_dir):
        abort(404)
    entries = os.listdir(target_dir)
    directories = []
    files = []
    for entry in entries:
        full_path = os.path.join(target_dir, entry)
        if os.path.isdir(full_path):
            directories.append(entry)
        elif os.path.isfile(full_path):
            ext = entry.rsplit(".", 1)[-1].lower()
            if ext in ALLOWED_EXTENSIONS:
                files.append(entry)
    return jsonify({
        "path": path,
        "directories": sorted(directories),
        "files": sorted(files),
    })


@app.route("/api/search")
def search_videos():
    """Search for videos by filename."""
    query = request.args.get("query", "").lower()
    results = []
    for root_dir, _dirs, files in os.walk(VIDEO_DIR):
        rel_root = os.path.relpath(root_dir, VIDEO_DIR)
        for name in files:
            ext = name.rsplit(".", 1)[-1].lower()
            if ext in ALLOWED_EXTENSIONS and query in name.lower():
                rel_path = os.path.join(rel_root, name)
                results.append(rel_path.replace("\\", "/"))
    return jsonify({"results": results})


@app.route("/api/video/<path:path>")
def get_video(path: str):
    """Stream a video file, handling HTTP Range requests."""
    full_path = safe_join(VIDEO_DIR, path)
    if not os.path.isfile(full_path):
        abort(404)
    range_header = request.headers.get("Range")
    if not range_header:
        return send_from_directory(VIDEO_DIR, path)

    size = os.path.getsize(full_path)
    byte1, byte2 = 0, size - 1
    match = range_header.strip().lower()
    if match.startswith("bytes="):
        match = match.split("=", 1)[1]
        start_end = match.split("-", 1)
        if start_end[0]:
            byte1 = int(start_end[0])
        if len(start_end) > 1 and start_end[1]:
            byte2 = int(start_end[1])
    length = byte2 - byte1 + 1
    with open(full_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)
    mime_type, _ = mimetypes.guess_type(full_path)
    rv = Response(data, 206, mimetype=mime_type, direct_passthrough=True)
    rv.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{size}')
    rv.headers.add('Accept-Ranges', 'bytes')
    return rv


@app.route("/api/thumb/<path:path>")
def get_thumbnail(path: str):
    """Return a JPEG thumbnail extracted at 1/3 of the video duration."""
    full_path = safe_join(VIDEO_DIR, path)
    if not os.path.isfile(full_path):
        abort(404)
    ffmpeg_bin = shutil.which("ffmpeg")
    ffprobe_bin = shutil.which("ffprobe")
    if not ffmpeg_bin:
        abort(500, description="FFmpeg executable not found")
    timestamp = "10"
    if ffprobe_bin:
        try:
            out = subprocess.check_output(
                [
                    ffprobe_bin,
                    "-v",
                    "error",
                    "-select_streams",
                    "v:0",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    full_path,
                ]
            )
            duration = float(out.strip())
            timestamp = str(duration / 3)
        except Exception:
            pass
    command = [
        ffmpeg_bin,
        "-ss",
        timestamp,
        "-i",
        full_path,
        "-vframes",
        "1",
        "-f",
        "image2",
        "-q:v",
        "2",
        "pipe:1",
    ]
    data = subprocess.check_output(command, stderr=subprocess.DEVNULL)
    return Response(data, mimetype="image/jpeg")


@app.route("/api/transcode/<path:path>")
def transcode_video(path: str):
    """Transcode an unsupported file to MP4 on the fly."""
    full_path = safe_join(VIDEO_DIR, path)
    if not os.path.isfile(full_path):
        abort(404)
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        abort(
            500,
            description="FFmpeg executable not found. Install ffmpeg and ensure it is available in your PATH.",
        )
    command = [
        ffmpeg_bin,
        "-i",
        full_path,
        "-f",
        "mp4",
        "-vcodec",
        "libx264",
        "-acodec",
        "aac",
        "-movflags",
        "frag_keyframe+empty_moov",
        "-loglevel",
        "error",
        "-",
    ]
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL
    )

    def generate():
        try:
            while True:
                chunk = process.stdout.read(8192)
                if not chunk:
                    break
                yield chunk
        finally:
            process.stdout.close()
            process.wait()

    return Response(
        stream_with_context(generate()), mimetype="video/mp4", direct_passthrough=True
    )


@app.route("/api/comments/<path:path>", methods=["GET", "POST"])
def video_comments(path: str):
    """Retrieve or add comments for a video."""
    full_path = safe_join(VIDEO_DIR, path)
    if not os.path.isfile(full_path):
        abort(404)
    conn = get_db()
    if request.method == "POST":
        data = request.get_json() or {}
        username = data.get("username", "Anonymous")
        comment = data.get("comment", "")
        rating = int(data.get("rating", 0))
        timestamp = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO comments (video, username, comment, rating, timestamp) VALUES (?, ?, ?, ?, ?)",
            (path, username, comment, rating, timestamp),
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})
    rows = conn.execute(
        "SELECT username, comment, rating, timestamp FROM comments WHERE video = ? ORDER BY id DESC",
        (path,),
    ).fetchall()
    conn.close()
    return jsonify({"comments": [dict(r) for r in rows]})


@app.route("/api/random_comment")
def random_comment():
    """Return a random comment from the database including the username."""
    conn = get_db()
    row = conn.execute(
        "SELECT video, comment, rating, username FROM comments ORDER BY RANDOM() LIMIT 1"
    ).fetchone()
    conn.close()
    if row:
        return jsonify(
            {
                "video": row[0],
                "comment": row[1],
                "rating": row[2],
                "username": row[3],
            }
        )
    return jsonify({})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
