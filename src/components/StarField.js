// StarField.js — animated canvas starfield background

export function initStarField() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createStars();
    }

    function createStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 3000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.3,
                opacity: Math.random(),
                speed: Math.random() * 0.005 + 0.002,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    function draw(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const star of stars) {
            const twinkle = 0.4 + 0.6 * Math.sin(time * star.speed + star.phase);
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 225, 255, ${star.opacity * twinkle})`;
            ctx.fill();
        }
        animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    animationId = requestAnimationFrame(draw);

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
    };
}
