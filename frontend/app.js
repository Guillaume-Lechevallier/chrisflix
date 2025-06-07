let currentPath = "";
let currentVideo = "";

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
            const totalItems = data.directories.length + data.files.length;
            if (totalItems < 10) {
                list.classList.add('few-items');
            } else {
                list.classList.remove('few-items');
            }
            data.directories.forEach(dir => {
                const tile = createDirectoryTile(dir);
                list.appendChild(tile);
            });
            data.files.forEach(file => {
                const fullPath = currentPath ? `${currentPath}/${file}` : file;
                const tile = createVideoTile(file, fullPath);
                list.appendChild(tile);
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

function createVideoTile(name, fullPath) {
    const div = document.createElement('div');
    div.className = 'tile';
    const img = document.createElement('img');
    img.src = `/api/thumb/${encodePath(fullPath)}`;
    img.alt = name;
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = name;
    div.appendChild(img);
    div.appendChild(title);
    div.onclick = () => playVideo(fullPath);
    return div;
}

function createDirectoryTile(name) {
    const div = document.createElement('div');
    div.className = 'tile dir-tile';
    const img = document.createElement('img');
    img.src = 'Dossier Vert.png';
    img.alt = name;
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = name + '/';
    div.appendChild(img);
    div.appendChild(title);
    div.onclick = () => load(currentPath ? `${currentPath}/${name}` : name);
    return div;
}

function searchVideos() {
    const q = document.getElementById('search-input').value.trim();
    if (!q) return;
    fetch(`/api/search?query=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => {
            document.getElementById('path').textContent = 'Search results';
            document.getElementById('back').style.display = 'none';
            const list = document.getElementById('items');
            list.innerHTML = '';
            data.results.forEach(p => {
                const name = p.split('/').pop();
                list.appendChild(createVideoTile(name, p));
            });
        });
}

function playVideo(path) {
    currentVideo = path;
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
    if (mime && !video.canPlayType(mime) && (ext === 'mkv' || ext === 'avi')) {
        source.src = `/api/transcode/${encoded}`;
        source.type = 'video/mp4';
    } else {
        source.src = `/api/video/${encoded}`;
    }
    video.load();
    player.style.display = 'block';
    video.play();
    player.scrollIntoView({ behavior: 'smooth' });
    loadComments(path);
}

function closePlayer() {
    const player = document.getElementById('player');
    const video = document.getElementById('video');
    video.pause();
    player.style.display = 'none';
}

function loadComments(path) {
    fetch(`/api/comments/${encodePath(path)}`)
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('comment-list');
            list.innerHTML = '';
            data.comments.forEach(c => {
                const li = document.createElement('li');
                const emoji = c.emoji || '';
                li.textContent = `${c.username} ${emoji} (${c.rating}/5): ${c.comment}`;
                list.appendChild(li);
            });
        });
}

function submitComment(event) {
    event.preventDefault();
    if (!currentVideo) return;
    const usernameInput = document.getElementById('username');
    const payload = {
        username: usernameInput.value,
        emoji: document.getElementById('emoji').value,
        comment: document.getElementById('comment-text').value,
        rating: document.getElementById('rating').value
    };
    fetch(`/api/comments/${encodePath(currentVideo)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        localStorage.setItem('username', payload.username);
        localStorage.setItem('emoji', payload.emoji);
        document.getElementById('comment-text').value = '';
        loadComments(currentVideo);
    });
}

function initEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    const hidden = document.getElementById('emoji');
    if (!picker) return;
    if (typeof EMOJI_LIST !== 'undefined') {
        picker.innerHTML = '';
        EMOJI_LIST.forEach(e => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'emoji-option';
            btn.textContent = e;
            picker.appendChild(btn);
        });
    }
    picker.addEventListener('click', e => {
        if (e.target.classList.contains('emoji-option')) {
            const value = e.target.textContent;
            hidden.value = value;
            picker.querySelectorAll('.emoji-option').forEach(btn =>
                btn.classList.remove('selected')
            );
            e.target.classList.add('selected');
            localStorage.setItem('emoji', value);
        }
    });
    const storedEmoji = localStorage.getItem('emoji');
    if (storedEmoji) {
        hidden.value = storedEmoji;
        const btn = Array.from(picker.querySelectorAll('.emoji-option')).find(
            b => b.textContent === storedEmoji
        );
        if (btn) {
            btn.classList.add('selected');
        }
    }
}

window.onload = () => {
    load();
    const stored = localStorage.getItem('username');
    if (stored) {
        document.getElementById('username').value = stored;
    }
    initEmojiPicker();
    document.getElementById('username').addEventListener('change', e => {
        localStorage.setItem('username', e.target.value);
    });
};
