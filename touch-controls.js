let scale = 1, maxScale = 4, lastDistance = 0;

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        lastDistance = Math.sqrt(
            (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
            (e.touches[0].clientY - e.touches[1].clientY) ** 2
        );
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        let distance = Math.sqrt(
            (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
            (e.touches[0].clientY - e.touches[1].clientY) ** 2
        );

        if (distance > lastDistance) {
            scale *= 1.02; // Zoom in
        } else {
            scale /= 1.02; // Zoom out
        }
        scale = Math.max(1, Math.min(maxScale, scale));
        lastDistance = distance;

        requestAnimationFrame(() => drawCanvas());
    }
}, { passive: false });

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
}
