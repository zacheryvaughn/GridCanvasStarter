// touchControls.js
(function() {
    const canvas = document.getElementById("canvas");
    const c = canvas.getContext("2d");

    // Variables
    let isPanning = false;
    let isZooming = false;
    let draggedItem = null;
    let startPanX = 0;
    let startPanY = 0;
    let lastDistance = 0; // Track the pinch distance for zoom
    let tapTimeout = null; // Tap and hold timeout
    let startX = 0, startY = 0; // For tracking object dragging position
    let originX = 0, originY = 0; // Canvas origin for zoom/pan calculations
    let scale = 1; // Current scale of the canvas

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
        const mouseX = (touch1.pageX + touch2.pageX) / 2;
        const mouseY = (touch1.pageY + touch2.pageY) / 2;
        const mouseXInWorld = (mouseX - originX) / scale;
        const mouseYInWorld = (mouseY - originY) / scale;

        originX = mouseX - mouseXInWorld * newScale;
        originY = mouseY - mouseYInWorld * newScale;

        scale = newScale;
        lastDistance = newDistance; // Update lastDistance

        draw();
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

        originX += deltaX * scale;  // Adjust position relative to zoom level
        originY += deltaY * scale;

        startPanX = e.touches[0].pageX;
        startPanY = e.touches[0].pageY;

        draw();
    }

    function handlePanEnd() {
        isPanning = false;
    }

    // Handle item dragging (tap and hold)
    function handleTapHold(e) {
        const { x, y } = getTouchPosition(e);

        if (e.touches.length === 1) { // Only one finger for drag operation
            // Clear any existing timeout
            if (tapTimeout) {
                clearTimeout(tapTimeout);
            }

            // Detect tap and hold for 0.5s
            tapTimeout = setTimeout(() => {
                draggedItem = findItem(x, y); // Find the tapped item
                if (draggedItem) {
                    startX = x - draggedItem.x;
                    startY = y - draggedItem.y;
                    draggedItem.isDragging = true; // Enable dragging on the item
                    isPanning = false;  // Disable panning while dragging
                }
            }, 500); // Wait 0.5s before initiating drag
        }
    }

    // Update the drag item during move
    function handleDragMove(e) {
        if (draggedItem && draggedItem.isDragging) {
            const { x, y } = getTouchPosition(e);
            draggedItem.x = x - startX; // Update item position based on touch movement
            draggedItem.y = y - startY;
            draw(); // Redraw canvas with updated position
        }
    }

    // End the drag process
    function handleDragEnd() {
        if (draggedItem) {
            draggedItem.isDragging = false;
            draggedItem = null;
        }
        // Clear the tap timeout and reset variables
        if (tapTimeout) {
            clearTimeout(tapTimeout);
            tapTimeout = null;
        }
        lastDistance = 0;
    }

    // Handle touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();

        // Handle tap hold for dragging
        handleTapHold(e);

        // Handle pinch-to-zoom (if two fingers)
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // Begin panning if the user starts moving with one finger
        handlePanStart(e);
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();

        // Handle zooming
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // Handle panning
        handlePanMove(e);

        // Handle item dragging
        handleDragMove(e);
    });

    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();

        // End panning if done
        handlePanEnd();

        // End dragging item
        handleDragEnd();

        // Reset zoom variables for future touch events
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
