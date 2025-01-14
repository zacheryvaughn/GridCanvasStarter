// Initialize gesture-related variables
let isZooming = false;
let lastTouchDist = 0;
let lastTouchMidpoint = null;
let doubleTapTimeout = null;
const DOUBLE_TAP_DELAY = 300;

// Touch Event Handlers
function initializeTouchEvents() {
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e) {
    e.preventDefault();

    if (e.touches.length === 1) {
        handleSingleTouchStart(e);
    } else if (e.touches.length === 2) {
        handlePinchStart(e);
    }
}

function handleSingleTouchStart(e) {
    // Check for double tap
    const currentTime = new Date().getTime();
    if (doubleTapTimeout && currentTime - doubleTapTimeout < DOUBLE_TAP_DELAY) {
        centerOrigin();
        draw();
        doubleTapTimeout = null;
    } else {
        doubleTapTimeout = currentTime;
    }

    // Check for rectangle dragging
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

function handlePinchStart(e) {
    isZooming = true;
    lastTouchDist = getTouchDistance(e);
    lastTouchMidpoint = getTouchMidpoint(e);
}

function handleTouchMove(e) {
    e.preventDefault();

    if (e.touches.length === 1 && draggedRect && draggedRect.isDragging) {
        handleDragTouchMove(e);
    } else if (e.touches.length === 2 && isZooming) {
        handlePinchMove(e);
    }
}

function handleDragTouchMove(e) {
    const touch = e.touches[0];
    const canvasRect = canvas.getBoundingClientRect();
    const touchX = (touch.clientX - canvasRect.left) * pixelRatio / scale - originX / scale;
    const touchY = (touch.clientY - canvasRect.top) * pixelRatio / scale - originY / scale;

    draggedRect.x = Math.round((touchX - offsetX) / 8) * 8;
    draggedRect.y = Math.round((touchY - offsetY) / 8) * 8;

    draw();
}

function handlePinchMove(e) {
    const currentTouchDist = getTouchDistance(e);
    const scaleFactor = currentTouchDist / lastTouchDist;

    const midpoint = getTouchMidpoint(e);
    const deltaX = (midpoint.x - lastTouchMidpoint.x) * pixelRatio;
    const deltaY = (midpoint.y - lastTouchMidpoint.y) * pixelRatio;

    // Calculate new scale while respecting bounds
    const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));

    // Update origin to maintain pinch center point
    const mouseXInWorld = (midpoint.x * pixelRatio - originX) / scale;
    const mouseYInWorld = (midpoint.y * pixelRatio - originY) / scale;

    originX = midpoint.x * pixelRatio - mouseXInWorld * newScale + deltaX;
    originY = midpoint.y * pixelRatio - mouseYInWorld * newScale + deltaY;

    scale = newScale;
    lastTouchDist = currentTouchDist;
    lastTouchMidpoint = midpoint;

    draw();
}

function handleTouchEnd(e) {
    if (draggedRect) {
        draggedRect.isDragging = false;
        draggedRect = null;
    }

    if (isZooming && e.touches.length < 2) {
        isZooming = false;
        lastTouchDist = 0;
        lastTouchMidpoint = null;
    }
}

function getTouchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(e) {
    return {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
    };
}

// Initialize touch events if device supports touch
if ('ontouchstart' in window) {
    initializeTouchEvents();
}