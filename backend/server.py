import os
import mimetypes
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, abort, request, Response

VIDEO_DIR = os.environ.get("VIDEO_DIR", "videos")

app = Flask(__name__, static_folder="../frontend", static_url_path="")

ALLOWED_EXTENSIONS = {"mp4", "mkv", "avi", "mov"}


def safe_join(base: str, *paths: str) -> str:
    base_path = Path(base).resolve()
    new_path = (base_path / Path(*paths)).resolve()
    if not str(new_path).startswith(str(base_path)):
        abort(404)
    return str(new_path)


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/list", defaults={"path": ""})
@app.route("/api/list/<path:path>")
def list_videos(path: str):
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
    return jsonify({"path": path, "directories": sorted(directories), "files": sorted(files)})


@app.route("/api/video/<path:path>")
def get_video(path: str):
    full_path = safe_join(VIDEO_DIR, path)
    if not os.path.isfile(full_path):
        abort(404)
    range_header = request.headers.get('Range')
    if not range_header:
        return send_from_directory(VIDEO_DIR, path)
    size = os.path.getsize(full_path)
    byte1, byte2 = 0, None
    if range_header:
        match = range_header.strip().lower().split('=')[-1]
        byte1, byte2 = match.split('-')[0], match.split('-')[1] if '-' in match else ''
        byte1 = int(byte1) if byte1 else 0
        byte2 = int(byte2) if byte2 else size - 1
    length = byte2 - byte1 + 1
    with open(full_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)
    mime_type, _ = mimetypes.guess_type(full_path)
    rv = Response(data, 206, mimetype=mime_type, direct_passthrough=True)
    rv.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{size}')
    rv.headers.add('Accept-Ranges', 'bytes')
    return rv


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
