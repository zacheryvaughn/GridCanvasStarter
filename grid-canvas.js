/**
 * Interactive Grid Canvas
 * Copyright (c) 2025 Zachery Vaughn
 * MIT License - see LICENSE file in the root directory
 */

const CONFIG = {
    CANVAS: {
        MIN_SCALE: 0.5,
        MAX_SCALE: 15,
        SCALE_STEP: 1.03,
        SCALE_RATE: 0.04,
        INITIAL_SCALE: 1.3,
    },
    GRID: {
        SMALL: {
            HIGH_ZOOM: 8,
            MEDIUM_ZOOM: 16,
            LOW_ZOOM: 32,
            COLOR: '#2B2F33'
        },
        LARGE: {
            SIZE: 64,
            COLOR: '#4C5259'
        },
        ORIGIN_CROSS_SIZE: 16,
        ORIGIN_COLOR: '#FFFFFF'
    },
    RECTANGLE: {
        SNAP_SIZE: 8,
        FONT: '8px Arial',
        TEXT_COLOR: '#000000',
        TEXT_OFFSET_X: 5,
        TEXT_OFFSET_Y: 10
    }
};

class CanvasState {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.pixelRatio = window.devicePixelRatio || 1;
        this.scale = CONFIG.CANVAS.INITIAL_SCALE * this.pixelRatio;
        this.originX = 0;
        this.originY = 0;
        this.isPanning = false;
        this.animationFrameId = null;
        
        this.setupCanvas();
        this.initializeEventListeners();
    }

    setupCanvas() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not supported in this browser');
            return;
        }
        this.resizeCanvasToDisplaySize();
        this.centerOrigin();
        this.scheduleRedraw();
    }

    resizeCanvasToDisplaySize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.canvas.width = width * this.pixelRatio;
        this.canvas.height = height * this.pixelRatio;
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
    }

    centerOrigin() {
        this.originX = this.canvas.width / 2;
        this.originY = this.canvas.height / 2;
    }

    scheduleRedraw() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => this.draw());
    }

    getWorldCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * this.pixelRatio / this.scale - this.originX / this.scale,
            y: (clientY - rect.top) * this.pixelRatio / this.scale - this.originY / this.scale
        };
    }

    cleanup() {
        this.removeEventListeners();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

class GridRenderer {
    constructor(canvasState) {
        this.state = canvasState;
    }

    getViewportBounds() {
        const canvasMinX = -this.state.originX / this.state.scale;
        const canvasMinY = -this.state.originY / this.state.scale;
        return {
            minX: canvasMinX,
            minY: canvasMinY,
            maxX: canvasMinX + this.state.canvas.width / this.state.scale,
            maxY: canvasMinY + this.state.canvas.height / this.state.scale
        };
    }

    drawGridLines(bounds, gridSize, color) {
        const ctx = this.state.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / this.state.scale;

        const startX = Math.floor(bounds.minX / gridSize) * gridSize;
        const startY = Math.floor(bounds.minY / gridSize) * gridSize;

        ctx.beginPath();
        for (let x = startX; x <= bounds.maxX; x += gridSize) {
            ctx.moveTo(x, bounds.minY);
            ctx.lineTo(x, bounds.maxY);
        }
        for (let y = startY; y <= bounds.maxY; y += gridSize) {
            ctx.moveTo(bounds.minX, y);
            ctx.lineTo(bounds.maxX, y);
        }
        ctx.stroke();
    }

    drawOriginCross() {
        const ctx = this.state.ctx;
        const size = CONFIG.GRID.ORIGIN_CROSS_SIZE;
        
        ctx.strokeStyle = CONFIG.GRID.ORIGIN_COLOR;
        ctx.lineWidth = 1 / this.state.scale;
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();
    }

    draw() {
        const bounds = this.getViewportBounds();
        let smallGridSize = null;

        if (this.state.scale >= 2.8) {
            smallGridSize = CONFIG.GRID.SMALL.HIGH_ZOOM;
        } else if (this.state.scale >= 1.4) {
            smallGridSize = CONFIG.GRID.SMALL.MEDIUM_ZOOM;
        } else if (this.state.scale >= 0.7) {
            smallGridSize = CONFIG.GRID.SMALL.LOW_ZOOM;
        }

        if (smallGridSize) {
            this.drawGridLines(bounds, smallGridSize, CONFIG.GRID.SMALL.COLOR);
        }
        this.drawGridLines(bounds, CONFIG.GRID.LARGE.SIZE, CONFIG.GRID.LARGE.COLOR);
        this.drawOriginCross();
    }
}

class Rectangle {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isDragging = false;
    }

    containsPoint(x, y) {
        return (
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.font = CONFIG.RECTANGLE.FONT;
        ctx.fillStyle = CONFIG.RECTANGLE.TEXT_COLOR;
        ctx.fillText(
            `X: ${this.x}, Y: ${this.y * -1}`,
            this.x + CONFIG.RECTANGLE.TEXT_OFFSET_X,
            this.y + CONFIG.RECTANGLE.TEXT_OFFSET_Y
        );
    }

    snapToGrid() {
        this.x = Math.round(this.x / CONFIG.RECTANGLE.SNAP_SIZE) * CONFIG.RECTANGLE.SNAP_SIZE;
        this.y = Math.round(this.y / CONFIG.RECTANGLE.SNAP_SIZE) * CONFIG.RECTANGLE.SNAP_SIZE;
    }
}

class InteractiveCanvas extends CanvasState {
    constructor(canvasId) {
        super(canvasId);
        this.gridRenderer = new GridRenderer(this);
        this.rectangles = this.initializeRectangles();
        this.draggedRect = null;
        this.dragOffset = { x: 0, y: 0 };
    }

    initializeRectangles() {
        return [
            new Rectangle(-144, -120, 120, 160, '#ff6961'),
            new Rectangle(48, -88, 104, 96, '#f8f38d'),
            new Rectangle(-192, -48, 128, 112, '#08cad1'),
            new Rectangle(72, 16, 112, 136, '#9d94ff'),
            new Rectangle(-80, 40, 104, 104, '#c780e8'),
            new Rectangle(64, -128, 144, 104, '#59adf6'),
            new Rectangle(-56, 72, 120, 104, '#42d6a4'),
            new Rectangle(-16, -144, 96, 80, '#ffb480')
        ];
    }

    initializeEventListeners() {
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this));
        
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
        
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeCanvasToDisplaySize();
            this.scheduleRedraw();
        });
        this.resizeObserver.observe(this.canvas);
        
        window.addEventListener('resize', () => {
            this.resizeCanvasToDisplaySize();
            this.scheduleRedraw();
        });
    }

    handleZoom(e) {
        e.preventDefault();
        const coords = this.getWorldCoordinates(e.clientX, e.clientY);
        
        const scaleFactor = Math.pow(
            CONFIG.CANVAS.SCALE_STEP,
            -e.deltaY * CONFIG.CANVAS.SCALE_RATE
        );
        
        const newScale = Math.max(
            CONFIG.CANVAS.MIN_SCALE,
            Math.min(this.scale * scaleFactor, CONFIG.CANVAS.MAX_SCALE)
        );
        
        this.originX = e.offsetX * this.pixelRatio - coords.x * newScale;
        this.originY = e.offsetY * this.pixelRatio - coords.y * newScale;
        
        this.scale = newScale;
        this.scheduleRedraw();
    }

    handleMouseDown(e) {
        if (e.button === 2) {
            this.startPanning(e);
        } else if (e.button === 0) {
            this.startDraggingRectangle(e);
        } else if (e.button === 1) {
            this.centerOrigin();
            this.scheduleRedraw();
        }
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            this.updatePanning(e);
        } else if (this.draggedRect) {
            this.updateRectangleDrag(e);
        }
    }

    handleMouseUp(e) {
        if (e.button === 2 && this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        } else if (e.button === 0 && this.draggedRect) {
            this.draggedRect.isDragging = false;
            this.draggedRect = null;
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseOut() {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        }
        if (this.draggedRect) {
            this.draggedRect.isDragging = false;
            this.draggedRect = null;
            this.canvas.style.cursor = 'default';
        }
    }

    startPanning(e) {
        this.isPanning = true;
        this.dragOffset = {
            x: e.clientX * this.pixelRatio - this.originX,
            y: e.clientY * this.pixelRatio - this.originY
        };
        this.canvas.style.cursor = 'grabbing';
    }

    updatePanning(e) {
        if (!this.isPanning) return;
        
        this.originX = e.clientX * this.pixelRatio - this.dragOffset.x;
        this.originY = e.clientY * this.pixelRatio - this.dragOffset.y;
        this.scheduleRedraw();
    }

    startDraggingRectangle(e) {
        const coords = this.getWorldCoordinates(e.clientX, e.clientY);
        
        for (let i = this.rectangles.length - 1; i >= 0; i--) {
            const rect = this.rectangles[i];
            if (rect.containsPoint(coords.x, coords.y)) {
                this.draggedRect = rect;
                this.dragOffset = {
                    x: coords.x - rect.x,
                    y: coords.y - rect.y
                };
                rect.isDragging = true;
                
                this.rectangles.splice(i, 1);
                this.rectangles.push(rect);
                
                this.canvas.style.cursor = 'grabbing';
                break;
            }
        }
    }

    updateRectangleDrag(e) {
        if (!this.draggedRect) return;
        
        const coords = this.getWorldCoordinates(e.clientX, e.clientY);
        this.draggedRect.x = coords.x - this.dragOffset.x;
        this.draggedRect.y = coords.y - this.dragOffset.y;
        this.draggedRect.snapToGrid();
        
        this.scheduleRedraw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.originX, this.originY);
        
        this.gridRenderer.draw();
        this.rectangles.forEach(rect => rect.draw(this.ctx));
        
        this.ctx.restore();
    }
}

const canvas = new InteractiveCanvas('canvas');