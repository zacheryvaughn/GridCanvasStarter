(function() {
    const canvas = document.getElementById("canvas");
    const c = canvas.getContext("2d");

    // Variables
    let isTouchPanning = false;
    let isTouchDragging = false;
    let isTouchZooming = false;
    let draggedItem = null;
    let startPanX = 0, startPanY = 0; // Start position for panning
    let lastDistance = 0; // Track the pinch distance for zoom
    let startX = 0, startY = 0; // For tracking object dragging position
    let initialTap = { x: 0, y: 0 }; // Store initial tap position
    let tapTimeout = null; // Timeout for detecting a tap and hold action
    const tapThreshold = 10; // Minimal movement to prevent accidental drag from panning

    // Handle pinch-to-zoom
    function handleTouchZooming(e) {
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

    // Handle touch panning
    function handleTouchPanning(e) {
        if (e.touches.length === 1 && !draggedItem) {
            isTouchPanning = true;
            startPanX = e.touches[0].pageX;
            startPanY = e.touches[0].pageY;
        }
        if (!isTouchPanning) return;

        const deltaX = e.touches[0].pageX - startPanX;
        const deltaY = e.touches[0].pageY - startPanY;

        originX += deltaX * pixelRatio;
        originY += deltaY * pixelRatio;

        startPanX = e.touches[0].pageX;
        startPanY = e.touches[0].pageY;

        requestAnimationFrame(() => draw());
    }

    // Handle item dragging
    function handleTouchDragging(e) {
        const { x, y } = getTouchPosition(e);

        if (e.touches.length === 1) {
            initialTap.x = x;
            initialTap.y = y;
            tapTimeout = setTimeout(() => {
                // After 0.8s, we check if there was enough time to qualify as a hold.
                draggedItem = findItem(x, y);
                if (draggedItem) {
                    draggedItem.isDragging = true;
                    startX = x - draggedItem.x;
                    startY = y - draggedItem.y;
                }
            }, 800); // Trigger drag after 0.8s hold
        }

        if (draggedItem && draggedItem.isDragging) {
            const moveX = Math.round((x - startX) / 8) * 8;
            const moveY = Math.round((y - startY) / 8) * 8;
            draggedItem.x = moveX;
            draggedItem.y = moveY;
            requestAnimationFrame(() => draw());
        } else if (e.touches.length === 1) {
            const currentTapDistance = Math.hypot(x - initialTap.x, y - initialTap.y);

            // Only start dragging after a proper tap with minimal movement (prevents accidental drag)
            if (currentTapDistance > tapThreshold) {
                clearTimeout(tapTimeout);  // If there's enough movement, cancel the hold timeout
            }
        }
    }

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

    // Event listeners
    canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            if (!isTouchZooming && !isTouchPanning) {
                handleTouchDragging(e); // Call dragging handler for touchstart
            }
            handleTouchPanning(e); // Handle panning regardless of touch state
        }

        if (e.touches.length === 2 && !isTouchPanning && !isTouchDragging) {
            handleTouchZooming(e); // Handle zoom if two touches detected
        }
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();

        if (isTouchZooming) handleTouchZooming(e);
        if (isTouchPanning) handleTouchPanning(e);
        if (isTouchDragging) handleTouchDragging(e);
    });

    canvas.addEventListener('touchend', function(e) {
        isTouchPanning = false;
        isTouchDragging = false;
        isTouchZooming = false;

        if (draggedItem) {
            draggedItem.isDragging = false;
            draggedItem = null;
        }

        lastDistance = 0; // Reset zoom distance
    });
})();
