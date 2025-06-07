window.addEventListener('load', () => {
    const canvas = document.getElementById('matrix');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    const drops = new Array(columns).fill(1);
    let currentComment = null;
    let currentUsername = null;
    let currentEmoji = '';
    let commentExpire = 0;
    const commentDuration = 5000; // display each comment for 5 seconds
    let commentX = 0;
    let commentY = 0;
    let commentColor = '#ff0';
    let nameColor = '#00f';

    function oppositeColor(hex) {
        const r = 255 - parseInt(hex.substr(1, 2), 16);
        const g = 255 - parseInt(hex.substr(3, 2), 16);
        const b = 255 - parseInt(hex.substr(5, 2), 16);
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }

    function randomColor() {
        let color;
        do {
            color = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        } while (color.toLowerCase() === '#00ff00');
        return color;
    }

    function fetchRandomComment() {
        fetch('/api/random_comment')
            .then(r => r.json())
            .then(data => {
                if (data && data.comment) {
                    const name = data.video.split('/').pop();
                    currentUsername = data.username || 'Anonymous';
                    currentEmoji = data.emoji || '';
                    currentComment = `${name}-${data.rating}/5-${data.comment}`;
                    commentExpire = Date.now() + commentDuration;
                    commentX = Math.random() * (width - currentComment.length * fontSize);
                    commentY = Math.random() * (height - fontSize);
                    commentColor = randomColor();
                    nameColor = oppositeColor(commentColor);
                }
            })
            .catch(() => {});
    }

    fetchRandomComment();
    setInterval(fetchRandomComment, 5000);

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / fontSize);
        drops.length = columns;
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
    }

    window.addEventListener('resize', resize);

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#0f0';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = Math.random() < 0.5 ? '0' : '1';
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }

        if (currentComment) {
            if (Date.now() > commentExpire) {
                currentComment = null;
                currentUsername = null;
            } else {
                ctx.font = fontSize + 'px monospace';
                ctx.fillStyle = nameColor;
                const nameText = currentUsername + (currentEmoji ? ' ' + currentEmoji : '') + ':';
                ctx.fillText(nameText, commentX, commentY);
                const nameWidth = ctx.measureText(nameText).width;
                ctx.fillStyle = commentColor;
                ctx.fillText(currentComment, commentX + nameWidth + fontSize * 0.25, commentY);
            }
        }
    }

    setInterval(draw, 50);
});
