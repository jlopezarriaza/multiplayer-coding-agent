// js/tools.js

// Base Tool Class (Interface concept)
class Tool {
    constructor(canvasManager, appState, historyManager) {
        this.canvasManager = canvasManager;
        this.ctx = canvasManager.ctx;
        this.appState = appState;
        this.historyManager = historyManager;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
    }

    onMouseDown(x, y) { }
    onMouseMove(x, y) { }
    onMouseUp(x, y) { }
    onActivated() { }
    onDeactivated() { }
}

export class PencilTool extends Tool {
    constructor(canvasManager, appState, historyManager) {
        super(canvasManager, appState, historyManager);
        this.lastX = 0;
        this.lastY = 0;
    }

    onMouseDown(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        this.canvasManager.setDrawingStyle(); // Set current color and brush size

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }

    onMouseMove(x, y) {
        if (!this.isDrawing) return;

        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    onMouseUp(x, y) {
        if (this.isDrawing) {
            this.ctx.closePath();
            this.isDrawing = false;
            this.historyManager.saveState();
        }
    }
}

export class EraserTool extends Tool {
    constructor(canvasManager, appState, historyManager) {
        super(canvasManager, appState, historyManager);
    }

    onMouseDown(x, y) {
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.erase(x, y);
    }

    onMouseMove(x, y) {
        if (!this.isDrawing) return;
        this.erase(x, y);
    }

    onMouseUp(x, y) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.historyManager.saveState();
        }
    }

    erase(x, y) {
        // Use clearRect for a true eraser effect
        const halfBrush = this.appState.brushSize / 2;
        this.ctx.clearRect(x - halfBrush, y - halfBrush, this.appState.brushSize, this.appState.brushSize);
    }
}
