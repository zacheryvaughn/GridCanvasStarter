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

    // Handle panning canvas (only if not dragging)
    function handlePanStart(e) {
        if (draggedItem) {
            return; // If an item is being dragged, do not start panning
        }

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

        originX += deltaX * pixelRatio;
        originY += deltaY * pixelRatio;

        startPanX = e.touches[0].pageX;
        startPanY = e.touches[0].pageY;

        requestAnimationFrame(() => draw());
    }

    function handlePanEnd() {
        isPanning = false;
    }

    // Handle item dragging (tap and hold) – Ensure dragging doesn't happen if panning is active
    let tapTimeout = null;
    canvas.addEventListener('touchstart', function(e) {
        // Prevent dragging if two fingers are on the screen (zooming)
        if (e.touches.length === 2) {
            return; // Two-finger touch detected, ignore drag action
        }

        const { x, y } = getTouchPosition(e);

        // Detect tap and hold for dragging item
        if (e.touches.length === 1 && !isPanning) { // Only allow dragging when not panning
            tapTimeout = setTimeout(() => {
                draggedItem = findItem(x, y); // Detect if an item was tapped
                if (draggedItem) {
                    draggedItem.isDragging = true;
                    startX = x - draggedItem.x; // Record the initial position offset
                    startY = y - draggedItem.y;
                }
            }, 500); // Tap and hold time for triggering drag action
        }

        // If two touches are detected, start zoom (pinch-to-zoom)
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // Begin panning if the user starts moving with one finger (unless dragging)
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

        // If dragging, handle item dragging (unless panning)
        if (draggedItem && draggedItem.isDragging && !isPanning) {
            const { x, y } = getTouchPosition(e);
            draggedItem.x = Math.round((x - startX) / 8) * 8;  // Keep grid snapping
            draggedItem.y = Math.round((y - startY) / 8) * 8;

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
        const touch = e.touches ? e.touches[0] : e; // Touch or mouse event
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = (touch.pageX - canvasRect.left) * pixelRatio / scale - originX / scale;
        const mouseY = (touch.pageY - canvasRect.top) * pixelRatio / scale - originY / scale;
        return { x: mouseX, y: mouseY };
    }

    // Utility to check if a point is within an item (rectangle)
    function findItem(x, y) {
        return rectangles.find((rect) => 
            x >= rect.x && x <= rect.x + rect.width &&
            y >= rect.y && y <= rect.y + rect.height
        );
    }

})();
