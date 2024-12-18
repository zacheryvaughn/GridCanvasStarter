const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');

// Initialize some Important Values
let draggedRect = null;
let offsetX = 0;
let offsetY = 0;
let originX = 0;
let originY = 0;
let isZooming = false;
let isPanning = false;

// Detect Device Pixel Ratio
let pixelRatio = window.devicePixelRatio || 1;
let scale = 1.3 * pixelRatio;

// Resizes the Canvas Dimensions based on Pixel Ratio
function resizecanvasToDisplaySize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    c.scale(pixelRatio, pixelRatio);
}

// Move Origin to the Center of Canvas
// (Top-Left is the canvas origin, but we want it in the center)
function centerOrigin() {
    originX = canvas.width / 2;
    originY = canvas.height / 2;
}

function handleZooming() {
    const zoomHandler = (e) => {
        e.preventDefault();

        const scaleStep = 1.03;
        const scaleRate = 0.04;
        const scaleFactor = Math.pow(scaleStep, -e.deltaY * scaleRate);

        const mouseX = e.offsetX * pixelRatio;
        const mouseY = e.offsetY * pixelRatio;
        const mouseXInWorld = (mouseX - originX) / scale;
        const mouseYInWorld = (mouseY - originY) / scale;

        const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));

        originX = mouseX - mouseXInWorld * newScale;
        originY = mouseY - mouseYInWorld * newScale;

        scale = newScale;

        requestAnimationFrame(() => draw());
    };

    canvas.addEventListener('wheel', zoomHandler);
}
handleZooming();


// Handle Panning the Canvas with Right Mouse Button Hold
function handlePanning() {
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            isPanning = true;
            startX = (e.clientX * pixelRatio) - originX;
            startY = (e.clientY * pixelRatio) - originY;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            originX = (e.clientX * pixelRatio) - startX;
            originY = (e.clientY * pixelRatio) - startY;
            requestAnimationFrame(() => draw());
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (isPanning && e.button === 2) {
            isPanning = false;
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('mouseout', () => {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = 'default';
        }
    });
}
handlePanning();

// Draw grid with dynamic size based on zoom level
function drawGrid() {
    // Determine small grid size based on the scale
    let smallGridSize;
    if (scale >= 2.8) {
        smallGridSize = 8;
    } else if (scale >= 1.4) {
        smallGridSize = 16;
    } else if (scale >= 0.7) {
        smallGridSize = 32;
    } else {
        smallGridSize = null;
    }

    // Calculate common canvas boundaries for grid drawing
    const canvasMinX = -originX / scale;
    const canvasMinY = -originY / scale;
    const canvasMaxX = canvasMinX + canvas.width / scale;
    const canvasMaxY = canvasMinY + canvas.height / scale;

    // Draw small grid lines
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

    // Draw large grid lines
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

    // Draw Origin Cross
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


// Rectangle Position, Size, Color, and Dragging Flag
// (I have made the values divisble by 8, but this is not strictly nessesary)
const rectangles = [
    { x: -144, y: -120, width: 120, height: 160, color: '#ff6961', isDragging: false },
    { x: 48,   y: -88,  width: 104, height: 96,  color: '#f8f38d', isDragging: false },
    { x: -192, y: -48,  width: 128, height: 112, color: '#08cad1', isDragging: false },
    { x: 72,   y: 16,   width: 112, height: 136, color: '#9d94ff', isDragging: false },
    { x: -80,  y: 40,   width: 104, height: 104, color: '#c780e8', isDragging: false },
    { x: 64,   y: -128, width: 144, height: 104, color: '#59adf6', isDragging: false },
    { x: -56,  y: 72,   width: 120, height: 104, color: '#42d6a4', isDragging: false },
    { x: -16,  y: -144, width: 96,  height: 80,  color: '#ffb480', isDragging: false }
];

// Draw the Rectangles and Display their Coordinates
// (The Y-Axis has been normalized here)
function drawRectangles() {
    rectangles.forEach((rect) => {
        c.fillStyle = rect.color;
        c.fillRect(rect.x, rect.y, rect.width, rect.height);
        c.font = '8px Arial';
        c.fillStyle = '#000000';
        c.fillText(`X: ${rect.x}, Y: ${rect.y * -1}`, rect.x + 5, rect.y + 10);
    });
}

// Main Draw Function
// (Calls all drawing functions and keeps the canvas clean)
function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.setTransform(scale, 0, 0, scale, originX, originY);
    drawGrid();
    drawRectangles();
    c.restore();
}

// Mouse down event for dragging rectangles
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button for dragging rectangles
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - canvasRect.left) * pixelRatio / scale - originX / scale;
        const mouseY = (e.clientY - canvasRect.top) * pixelRatio / scale - originY / scale;

        for (let i = rectangles.length - 1; i >= 0; i--) {
            const rect = rectangles[i];
            if (
                mouseX >= rect.x &&
                mouseX <= rect.x + rect.width &&
                mouseY >= rect.y &&
                mouseY <= rect.y + rect.height
            ) {
                draggedRect = rect;
                offsetX = mouseX - rect.x;
                offsetY = mouseY - rect.y;
                rect.isDragging = true;

                rectangles.splice(i, 1);
                rectangles.push(draggedRect);

                canvas.style.cursor = 'grabbing'; // Set cursor to grabbing while dragging
                break;
            }
        }
    }
});

// Mouse move event for dragging rectangles
canvas.addEventListener('mousemove', (e) => {
    if (draggedRect && draggedRect.isDragging) {
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - canvasRect.left) * pixelRatio / scale - originX / scale;
        const mouseY = (e.clientY - canvasRect.top) * pixelRatio / scale - originY / scale;

        draggedRect.x = Math.round((mouseX - offsetX) / 8) * 8;
        draggedRect.y = Math.round((mouseY - offsetY) / 8) * 8;

        draw();
    }
});

// Mouse up event to stop dragging
canvas.addEventListener('mouseup', () => {
    if (draggedRect) {
        draggedRect.isDragging = false;
        draggedRect = null;
        canvas.style.cursor = 'default'; // Reset cursor after dragging
    }
});

// Handle middle mouse button click to center the canvas
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        centerOrigin();
        draw();
    }
});

// Redraw the Canvas if the Canvas Size Changes
const resizeObserver = new ResizeObserver(() => {
    resizecanvasToDisplaySize();
    draw();
});
resizeObserver.observe(canvas);

// Redraw the Canvas if the Window Size Changes
window.addEventListener('resize', () => {
    resizecanvasToDisplaySize();
    draw();
});

// Initialize canvas and handle resizing
function setupcanvas() {
    resizecanvasToDisplaySize();
    centerOrigin();
    draw();
}
setupcanvas();