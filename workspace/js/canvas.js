// js/canvas.js

export class CanvasManager {
    constructor(canvas, ctx, appState) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.appState = appState;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        this.activeTool = null;
    }

    init() {
        this.resizeCanvas(); // Ensure canvas matches its CSS size if any
        this.addEventListeners();
        this.clearCanvas();
    }

    resizeCanvas() {
        // If canvas size is set via CSS, ensure internal resolution matches
        // For now, we use fixed sizes from HTML, so this is a placeholder
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);
        this.canvas.addEventListener('mouseleave', this.mouseUpHandler);
    }

    // Using arrow functions to bind 'this' correctly
    mouseDownHandler = (e) => {
        const { x, y } = this.getMouseCoords(e);
        if (this.activeTool) {
            this.activeTool.onMouseDown(x, y);
        }
    };

    mouseMoveHandler = (e) => {
        const { x, y } = this.getMouseCoords(e);
        if (this.activeTool) {
            this.activeTool.onMouseMove(x, y);
        }
    };

    mouseUpHandler = (e) => {
        const { x, y } = this.getMouseCoords(e);
        if (this.activeTool) {
            this.activeTool.onMouseUp(x, y);
        }
    };

    getMouseCoords(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    setDrawingStyle() {
        this.ctx.strokeStyle = this.appState.currentColor;
        this.ctx.fillStyle = this.appState.currentColor;
        this.ctx.lineWidth = this.appState.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white'; // Ensure background is white
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setActiveTool(tool) {
        if (this.activeTool && this.activeTool.onDeactivated) {
            this.activeTool.onDeactivated();
        }
        this.activeTool = tool;
        if (this.activeTool && this.activeTool.onActivated) {
            this.activeTool.onActivated();
        }
    }

    redrawCanvas(imageData) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (imageData) {
            this.ctx.putImageData(imageData, 0, 0);
        } else {
            this.clearCanvas(); // If no image data, clear to white
        }
    }
}
