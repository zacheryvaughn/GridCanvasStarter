// Initialize gesture-related variables
let lastTouchDist = 0;
let lastTouchMidpoint = null;
let doubleTapTimeout = null;

// Touch Event Handlers
function handleTouchEvents() {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();

        if (e.touches.length === 1) {
            // Start tracking for a potential double-tap
            handleDoubleTap(e);

            // Initiate panning or dragging
            const touch = e.touches[0];
            const canvasRect = canvas.getBoundingClientRect();
            const touchX = (touch.clientX - canvasRect.left) * pixelRatio / scale - originX / scale;
            const touchY = (touch.clientY - canvasRect.top) * pixelRatio / scale - originY / scale;

            for (let i = rectangles.length - 1; i >= 0; i--) {
                const rect = rectangles[i];
                if (
                    touchX >= rect.x &&
                    touchX <= rect.x + rect.width &&
                    touchY >= rect.y &&
                    touchY <= rect.y + rect.height
                ) {
                    draggedRect = rect;
                    offsetX = touchX - rect.x;
                    offsetY = touchY - rect.y;
                    rect.isDragging = true;

                    rectangles.splice(i, 1);
                    rectangles.push(draggedRect);
                    break;
                }
            }
        }

        if (e.touches.length === 2) {
            // Pinch-to-zoom
            isZooming = true;
            lastTouchDist = getTouchDistance(e);
            lastTouchMidpoint = getTouchMidpoint(e);
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();

        if (e.touches.length === 1 && draggedRect && draggedRect.isDragging) {
            // Dragging
            const touch = e.touches[0];
            const canvasRect = canvas.getBoundingClientRect();
            const touchX = (touch.clientX - canvasRect.left) * pixelRatio / scale - originX / scale;
            const touchY = (touch.clientY - canvasRect.top) * pixelRatio / scale - originY / scale;

            draggedRect.x = Math.round((touchX - offsetX) / 8) * 8;
            draggedRect.y = Math.round((touchY - offsetY) / 8) * 8;

            draw();
        }

        if (e.touches.length === 2 && isZooming) {
            // Zooming
            const currentTouchDist = getTouchDistance(e);
            const scaleFactor = currentTouchDist / lastTouchDist;

            const midpoint = getTouchMidpoint(e);
            const deltaX = (midpoint.x - lastTouchMidpoint.x) * pixelRatio;
            const deltaY = (midpoint.y - lastTouchMidpoint.y) * pixelRatio;

            // Update scale and origin
            const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));
            const mouseXInWorld = (midpoint.x * pixelRatio - originX) / scale;
            const mouseYInWorld = (midpoint.y * pixelRatio - originY) / scale;

            originX = midpoint.x * pixelRatio - mouseXInWorld * newScale + deltaX;
            originY = midpoint.y * pixelRatio - mouseYInWorld * newScale + deltaY;

            scale = newScale;
            lastTouchDist = currentTouchDist;
            lastTouchMidpoint = midpoint;

            draw();
        }
    });

    canvas.addEventListener('touchend', (e) => {
        if (draggedRect) {
            draggedRect.isDragging = false;
            draggedRect = null;
        }
        if (isZooming && e.touches.length < 2) {
            isZooming = false;
            lastTouchDist = 0;
            lastTouchMidpoint = null;
        }
    });
}

// Double-Tap Handling
function handleDoubleTap(e) {
    const currentTime = new Date().getTime();
    if (doubleTapTimeout && currentTime - doubleTapTimeout < 300) {
        scale = pixelRatio;
        centerOrigin();
        draw();
        doubleTapTimeout = null;
    } else {
        doubleTapTimeout = currentTime;
    }
}

// Helper Functions
function getTouchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(e) {
    const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    return { x, y };
}

// Initialize Touch Gestures
handleTouchEvents();
