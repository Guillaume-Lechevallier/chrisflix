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
    let commentExpire = 0;
    const commentDuration = 5000; // display each comment for 5 seconds
    let commentX = 0;
    let commentY = 0;

    function fetchRandomComment() {
        fetch('/api/random_comment')
            .then(r => r.json())
            .then(data => {
                if (data && data.comment) {
                    const name = data.video.split('/').pop();
                    currentComment = `${name}-${data.rating}/5-${data.comment}`;
                    commentExpire = Date.now() + commentDuration;
                    commentX = (width - currentComment.length * fontSize) / 2;
                    commentY = height - fontSize * 2;
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
            } else {
                ctx.fillStyle = '#ff0';
                ctx.fillText(currentComment, commentX, commentY);
            }
        }
    }

    setInterval(draw, 50);
});
