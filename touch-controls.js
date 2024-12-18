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
    let initialTap = { x: 0, y: 0 }; // Store initial tap position for detection
    let tapTimeout = null; // Timeout for detecting a tap and hold action
    const tapThreshold = 10; // Minimal movement to prevent accidental drag from panning
    let isTapComplete = false;  // Flag for tap detection

    // Handle pinch-to-zoom
    function handleZoom(e) {
        e.preventDefault();

        // Zoom logic as before...
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

    // Handle panning canvas
    function handlePanStart(e) {
        if (e.touches.length === 1 && !draggedItem && !isTapComplete) { // Start panning with one finger
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

    // Handle item dragging (tap-then-hold)
    canvas.addEventListener('touchstart', function(e) {
        const { x, y } = getTouchPosition(e);

        // Only track tap when no item is being dragged and not in hold state
        if (e.touches.length === 1) {
            initialTap.x = x;
            initialTap.y = y;

            // Tap detection logic (tap must be quick, no drag initiated yet)
            if (!draggedItem && !isTapComplete) {
                tapTimeout = setTimeout(() => {
                    // If touch is held for 0.8s, allow dragging
                    isTapComplete = true; // Mark that tap has been completed
                    draggedItem = findItem(x, y);
                    if (draggedItem) {
                        draggedItem.isDragging = true;
                        startX = x - draggedItem.x;
                        startY = y - draggedItem.y;
                    }
                }, 800); // 0.8s hold to initiate dragging
            }
        }

        // If two touches are detected, it's zoom
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // Begin panning if the user starts with one finger
        handlePanStart(e);
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();

        // If zooming, handle zoom
        if (e.touches.length === 2) {
            handleZoom(e);
        }

        // Handle panning if active
        if (!draggedItem) {
            handlePanMove(e);
        }

        // If dragging, move the item with finger
        if (draggedItem && draggedItem.isDragging) {
            const { x, y } = getTouchPosition(e);
            draggedItem.x = Math.round((x - startX) / 8) * 8;  // Keep grid snapping
            draggedItem.y = Math.round((y - startY) / 8) * 8;

            requestAnimationFrame(() => draw());
        } else if (e.touches.length === 1) {
            const currentTapDistance = Math.hypot(x - initialTap.x, y - initialTap.y);

            // Only start dragging after a proper tap with minimal movement (prevents accidental drag)
            if (currentTapDistance > tapThreshold) {
                clearTimeout(tapTimeout);  // If there's enough movement, cancel the hold timeout
            }
        }
    });

    canvas.addEventListener('touchend', function(e) {
        // End pan and drag
        handlePanEnd();

        if (draggedItem) {
            draggedItem.isDragging = false;
            draggedItem = null;
        }

        // Reset zoom variables
        lastDistance = 0;

        // After touchend, reset tap tracking
        isTapComplete = false;
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
