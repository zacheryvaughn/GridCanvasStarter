// touchControls.js
(function() {
    const canvas = document.getElementById("canvas");
    const c = canvas.getContext("2d");

    // Variables
    let isPanning = false;
    let isZooming = false;
    let dragItem = null;
    let startPanX = 0;
    let startPanY = 0;
    let lastDistance = 0; // Track the pinch distance for zoom
    let startX = 0, startY = 0; // For tracking object dragging position

    // Handle pinch-to-zoom
    function handleZoom(e) {
        e.preventDefault();

        // If there are fewer than 2 touches, exit
        if (e.touches.length < 2) return;

        // Calculate pinch distance between two touches
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const newDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);

        // If there's no previous distance, save the first value
        if (lastDistance === 0) {
            lastDistance = newDistance;
            return;
        }

        // Calculate zoom scale
        const scaleFactor = newDistance / lastDistance;
        const newScale = Math.max(0.5, Math.min(scale * scaleFactor, 15));

        // Set zoom center (position where pinch is happening on canvas)
        const mouseX = (touch1.pageX + touch2.pageX) / 2 * pixelRatio;
        const mouseY = (touch1.pageY + touch2.pageY) / 2 * pixelRatio;
        const mouseXInWorld = (mouseX - originX) / scale;
        const mouseYInWorld = (mouseY - originY) / scale;

        originX = mouseX - mouseXInWorld * newScale;
        originY = mouseY - mouseYInWorld * newScale;

        scale = newScale;
        lastDistance = newDistance; // Update lastDistance

        requestAnimationFrame(() => draw());
    }

    // Handle panning canvas
    function handlePanStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) { // Start panning with one finger
            isPanning = true;
            startPanX = e.touches[0].pageX;
            startPanY = e.touches[0].pageY;
        }
    }

    function handlePanMove(e) {
        if (!isPanning) return;

        const deltaX = e.touches[0].pageX - startPanX;
        const deltaY = e.touches[0].pageY - startPanY;

        originX += deltaX * pixelRatio / scale;  // Adjust position relative to zoom level
        originY += deltaY * pixelRatio / scale;

        startPanX = e.touches[0].pageX;
        startPanY = e.touches[0].pageY;

        requestAnimationFrame(() => draw());
    }

    function handlePanEnd() {
        isPanning = false;
    }

    // Handle item dragging (tap and hold)
    let tapTimeout = null;
    canvas.addEventListener('touchstart', function(e) {
        const { x, y } = getTouchPosition(e);

        // Detect tap and hold for dragging item
        if (e.touches.length === 1) {
            tapTimeout = setTimeout(() => {
                draggedItem = findItem(x, y); // Detect if an item was tapped
                if (draggedItem) draggedItem.isDragging = true;
            }, 500); // Tap and hold time for triggering drag action
        }

        // If two touches are detected, start zoom (pinch-to-zoom)
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // Begin panning if the user starts moving with one finger
        handlePanStart(e);
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();

        // If zooming, handle zoom
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // If panning, handle panning
        handlePanMove(e);

        // If dragging, handle item dragging
        if (draggedItem && draggedItem.isDragging) {
            const { x, y } = getTouchPosition(e);
            draggedItem.x = x - startX; // Update item position
            draggedItem.y = y - startY;
            requestAnimationFrame(() => draw());
        }
    });

    canvas.addEventListener('touchend', function(e) {
        // Clear pan state if done
        handlePanEnd();

        // Stop dragging item
        if (draggedItem) {
            draggedItem.isDragging = false;
            draggedItem = null;
        }

        // Reset zoom variables
        lastDistance = 0;
    });

    // Utility function to get touch position
    function getTouchPosition(e) {
        const touch = e.touches ? e.touches[0] : e;
        return { x: touch.pageX, y: touch.pageY };
    }

    // Utility to check if a point is within an item (rectangle)
    function findItem(x, y) {
        return rectangles.find((rect) => 
            x >= rect.x && x <= rect.x + rect.width &&
            y >= rect.y && y <= rect.y + rect.height
        );
    }

})();
