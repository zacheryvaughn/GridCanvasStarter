function handleTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let initialScale = scale;
    let initialOriginX = originX;
    let initialOriginY = originY;
    let isPanning = false;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            // Single touch, prepare to pan
            isPanning = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && isPanning) {
            // Handle panning with one finger
            let deltaX = e.touches[0].clientX - touchStartX;
            let deltaY = e.touches[0].clientY - touchStartY;
            originX = initialOriginX + deltaX * pixelRatio / scale;
            originY = initialOriginY + deltaY * pixelRatio / scale;
            draw();
        } else if (e.touches.length === 2) {
            // Handle pinch-to-zoom with two fingers
            let touch1 = e.touches[0];
            let touch2 = e.touches[1];
            let dist = getDistance({x: touch1.clientX, y: touch1.clientY}, {x: touch2.clientX, y: touch2.clientY});
            let scaleFactor = dist / initialDist;

            scale = Math.max(0.5, Math.min(initialScale * scaleFactor, 15));

            let center = getCenter({x: touch1.clientX, y: touch1.clientY}, {x: touch2.clientX, y: touch2.clientY});
            let dx = center.x - originX;
            let dy = center.y - originY;

            originX = center.x - dx * scale;
            originY = center.y - dy * scale;

            draw();
        }
    });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            isPanning = false;
            initialScale = scale;
            initialOriginX = originX;
            initialOriginY = originY;
        }
    });
}

handleTouchGestures();
