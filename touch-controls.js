let lastTouchDistance = 0;
let touchOriginX = 0;
let touchOriginY = 0;

// Pinch Zoom Handler
function handlePinchZoom() {
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Calculate the initial distance between touches
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDistance = Math.sqrt(dx * dx + dy * dy);

            // Record the midpoint between touches as the zoom origin
            touchOriginX = (e.touches[0].clientX + e.touches[1].clientX) / 2 * pixelRatio;
            touchOriginY = (e.touches[0].clientY + e.touches[1].clientY) / 2 * pixelRatio;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            // Calculate the new distance between touches
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const touchDistance = Math.sqrt(dx * dx + dy * dy);

            // Calculate scale factor
            const scaleFactor = touchDistance / lastTouchDistance;

            // Update the scale within bounds
            const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));
            const zoomFactor = newScale / scale;

            // Update the origin to zoom around the midpoint
            const touchOriginInWorldX = (touchOriginX - originX) / scale;
            const touchOriginInWorldY = (touchOriginY - originY) / scale;
            originX = touchOriginX - touchOriginInWorldX * newScale;
            originY = touchOriginY - touchOriginInWorldY * newScale;

            scale = newScale;

            lastTouchDistance = touchDistance;

            requestAnimationFrame(() => draw());
        }
    });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            lastTouchDistance = 0; // Reset distance when pinch gesture ends
        }
    });
}

handlePinchZoom();