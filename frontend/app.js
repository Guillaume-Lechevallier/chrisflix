let currentPath = "";

function encodePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
}

function apiListUrl(path) {
    return path ? `/api/list/${encodePath(path)}` : "/api/list";
}

function load(path = "") {
    fetch(apiListUrl(path))
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load directory");
            }
            return response.json();
        })
        .then(data => {
            currentPath = data.path;
            document.getElementById("path").textContent = '/' + currentPath;
            document.getElementById("back").style.display = currentPath ? 'block' : 'none';
            const list = document.getElementById("items");
            list.innerHTML = '';
            data.directories.forEach(dir => {
                const li = document.createElement('li');
                li.textContent = dir + '/';
                li.onclick = () => load(currentPath ? `${currentPath}/${dir}` : dir);
                list.appendChild(li);
            });
            data.files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file;
                li.onclick = () => playVideo(currentPath ? `${currentPath}/${file}` : file);
                list.appendChild(li);
            });
        })
        .catch(err => alert(err.message));
}

function goBack() {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/');
    load(newPath);
}

function playVideo(path) {
    const player = document.getElementById('player');
    const video = document.getElementById('video');
    const source = document.getElementById('video-source');
    const encoded = encodePath(path);
    const ext = path.split('.').pop().toLowerCase();
    const mimeMap = {
        'mp4': 'video/mp4',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime'
    };
    let mime = mimeMap[ext] || '';
    source.type = mime;
    if (mime && !video.canPlayType(mime) && ext === 'mkv') {
        source.src = `/api/transcode/${encoded}`;
        source.type = 'video/mp4';
    } else {
        source.src = `/api/video/${encoded}`;
    }
    video.load();
    player.style.display = 'block';
    video.play();
}

function closePlayer() {
    const player = document.getElementById('player');
    const video = document.getElementById('video');
    video.pause();
    player.style.display = 'none';
}

window.onload = () => load();
