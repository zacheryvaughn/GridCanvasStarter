const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');

// Variables for Mouse and Touch Interactions
let draggedRect = null;
let offsetX = 0;
let offsetY = 0;
let originX = 0;
let originY = 0;
let scale = 1.3 * (window.devicePixelRatio || 1);
let isZooming = false;
let isPanning = false;
let lastDistance = 0;  // Track the pinch distance for zoom
let startPanX = 0, startPanY = 0;  // For panning touch start position
let initialTap = { x: 0, y: 0 };  // Initial tap position for hold detection
let tapTimeout = null;
const tapThreshold = 10;  // Minimal movement to detect a hold

// Resize Canvas Based on Pixel Ratio
function resizeCanvasToDisplaySize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// Move Origin to Canvas Center
function centerOrigin() {
    originX = canvas.width / 2;
    originY = canvas.height / 2;
}

// Zoom Event (Pinch-to-Zoom Handling)
function handleZoom(e) {
    e.preventDefault();
    
    if (e.touches.length < 2) return;
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const newDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);

    if (lastDistance === 0) {
        lastDistance = newDistance;
        return;
    }

    const scaleFactor = newDistance / lastDistance;
    const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));

    const mouseX = (touch1.pageX + touch2.pageX) / 2;
    const mouseY = (touch1.pageY + touch2.pageY) / 2;

    const mouseXInWorld = (mouseX - originX) / scale;
    const mouseYInWorld = (mouseY - originY) / scale;

    originX = mouseX - mouseXInWorld * newScale;
    originY = mouseY - mouseYInWorld * newScale;
    scale = newScale;

    lastDistance = newDistance;

    requestAnimationFrame(() => draw());
}

// Panning (One-finger swipe on touch screen)
function handlePanStart(e) {
    if (e.touches.length === 1 && !draggedRect) {  // One finger pan
        isPanning = true;
        startPanX = e.touches[0].pageX;
        startPanY = e.touches[0].pageY;
    }
}

function handlePanMove(e) {
    if (!isPanning) return;
    
    const deltaX = e.touches[0].pageX - startPanX;
    const deltaY = e.touches[0].pageY - startPanY;

    originX += deltaX * window.devicePixelRatio;
    originY += deltaY * window.devicePixelRatio;

    startPanX = e.touches[0].pageX;
    startPanY = e.touches[0].pageY;

    requestAnimationFrame(() => draw());
}

function handlePanEnd() {
    isPanning = false;
}

// Detect Tap Hold for Dragging Objects
canvas.addEventListener('touchstart', function(e) {
    const { x, y } = getTouchPosition(e);

    // Start tracking position for tap
    if (e.touches.length === 1) {
        initialTap.x = x;
        initialTap.y = y;
        tapTimeout = setTimeout(() => {
            // After 0.8s, qualify as a long tap and allow dragging
            draggedRect = findItem(x, y);
            if (draggedRect) {
                draggedRect.isDragging = true;
                offsetX = x - draggedRect.x;
                offsetY = y - draggedRect.y;
            }
        }, 800);
    }

    // Zoom handling for two-touch events
    if (e.touches.length === 2) {
        handleZoom(e);
    }

    // Begin pan operation if one-finger touch starts
    handlePanStart(e);
});

// Handle touch move for zoom, pan, and object dragging
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();

    // If two touches detected, it's zoom
    if (e.touches.length === 2) {
        handleZoom(e);
    }

    // If dragging, move object with finger
    if (draggedRect && draggedRect.isDragging) {
        const { x, y } = getTouchPosition(e);
        draggedRect.x = Math.round((x - offsetX) / 8) * 8;
        draggedRect.y = Math.round((y - offsetY) / 8) * 8;
        requestAnimationFrame(() => draw());
    } else if (e.touches.length === 1) {
        handlePanMove(e);
    }
});

// Reset dragging state on touch end
canvas.addEventListener('touchend', function(e) {
    handlePanEnd();
    if (draggedRect) {
        draggedRect.isDragging = false;
        draggedRect = null;
    }
    lastDistance = 0;
});

// Get touch position adjusted for scaling and origin
function getTouchPosition(e) {
    const touch = e.touches ? e.touches[0] : e;  // Choose the first touch or mouse event
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = (touch.pageX - canvasRect.left) * window.devicePixelRatio / scale - originX / scale;
    const mouseY = (touch.pageY - canvasRect.top) * window.devicePixelRatio / scale - originY / scale;
    return { x: mouseX, y: mouseY };
}

// Check if a point is within a rectangle
function findItem(x, y) {
    return rectangles.find((rect) =>
        x >= rect.x && x <= rect.x + rect.width &&
        y >= rect.y && y <= rect.y + rect.height
    );
}

// Draw Grid, Rectangles, and other elements
function drawGrid() {
    let smallGridSize = scale >= 2.8 ? 8 : scale >= 1.4 ? 16 : scale >= 0.7 ? 32 : null;
    const canvasMinX = -originX / scale;
    const canvasMinY = -originY / scale;
    const canvasMaxX = canvasMinX + canvas.width / scale;
    const canvasMaxY = canvasMinY + canvas.height / scale;

    if (smallGridSize) {
        c.strokeStyle = '#2B2F33';
        c.lineWidth = 1 / scale;
        let startX = Math.floor(canvasMinX / smallGridSize) * smallGridSize;
        let startY = Math.floor(canvasMinY / smallGridSize) * smallGridSize;
        for (let x = startX; x <= canvasMaxX; x += smallGridSize) {
            c.beginPath();
            c.moveTo(x, canvasMinY);
            c.lineTo(x, canvasMaxY);
            c.stroke();
        }
        for (let y = startY; y <= canvasMaxY; y += smallGridSize) {
            c.beginPath();
            c.moveTo(canvasMinX, y);
            c.lineTo(canvasMaxX, y);
            c.stroke();
        }
    }

    // Larger grid
    const largeGridSize = 64;
    c.strokeStyle = '#4C5259';
    c.lineWidth = 1 / scale;
    let startX = Math.floor(canvasMinX / largeGridSize) * largeGridSize;
    let startY = Math.floor(canvasMinY / largeGridSize) * largeGridSize;
    for (let x = startX; x <= canvasMaxX; x += largeGridSize) {
        c.beginPath();
        c.moveTo(x, canvasMinY);
        c.lineTo(x, canvasMaxY);
        c.stroke();
    }
    for (let y = startY; y <= canvasMaxY; y += largeGridSize) {
        c.beginPath();
        c.moveTo(canvasMinX, y);
        c.lineTo(canvasMaxX, y);
        c.stroke();
    }

    // Origin Cross
    const crossSize = 16;
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = 1 / scale;
    c.beginPath();
    c.moveTo(-crossSize, 0);
    c.lineTo(crossSize, 0);
    c.moveTo(0, -crossSize);
    c.lineTo(0, crossSize);
    c.stroke();
}

// Draw rectangles on canvas
function drawRectangles() {
    rectangles.forEach((rect) => {
        c.fillStyle = rect.color;
        c.fillRect(rect.x, rect.y, rect.width, rect.height);
        c.font = '8px Arial';
        c.fillStyle = '#000';
        c.fillText(`X: ${rect.x}, Y: ${rect.y * -1}`, rect.x + 5, rect.y + 10);
    });
}

// Main draw function (calls grid, rectangles, etc.)
function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.setTransform(scale, 0, 0, scale, originX, originY);
    drawGrid();
    drawRectangles();
    c.restore();
}

// Initialize everything (resize, draw, etc.)
function setupCanvas() {
    resizeCanvasToDisplaySize();
    centerOrigin();
    draw();
}

setupCanvas();

