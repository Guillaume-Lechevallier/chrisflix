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
    const encoded = encodePath(path);
    video.src = `/api/video/${encoded}`;
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
