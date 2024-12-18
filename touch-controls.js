const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');

// Initialize some variables
let scale = 1;
let originX = 0;
let originY = 0;
let lastTouchDistance = 0;
let touchOriginX = 0;
let touchOriginY = 0;

// Prevent viewport zooming on the canvas
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);

        // Midpoint for zoom origin
        touchOriginX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        touchOriginY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const touchDistance = Math.sqrt(dx * dx + dy * dy);

        // Scale factor based on distance change
        const scaleFactor = touchDistance / lastTouchDistance;
        const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));
        const zoomFactor = newScale / scale;

        // Adjust origin to zoom on touch midpoint
        const touchOriginInWorldX = (touchOriginX - originX) / scale;
        const touchOriginInWorldY = (touchOriginY - originY) / scale;

        originX = touchOriginX - touchOriginInWorldX * newScale;
        originY = touchOriginY - touchOriginInWorldY * newScale;

        scale = newScale;
        lastTouchDistance = touchDistance;

        requestAnimationFrame(draw);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        lastTouchDistance = 0; // Reset gesture state
    }
});

// Draw function (simplified)
function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.setTransform(scale, 0, 0, scale, originX, originY);

    // Example: draw a grid for visual testing
    c.fillStyle = "#ccc";
    c.fillRect(-50, -50, 100, 100);

    c.restore();
}
draw();
