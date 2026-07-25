// js/history.js

export class HistoryManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 20; // Limit history states to avoid excessive memory usage
    }

    saveState() {
        this.redoStack = []; // Clear redo stack on new action
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.undoStack.push(imageData);

        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift(); // Remove the oldest state if over limit
        }
    }

    undo() {
        if (this.undoStack.length > 1) { // Always keep at least one state (the initial empty canvas)
            const lastState = this.undoStack.pop();
            this.redoStack.push(lastState);
            this._restoreState(this.undoStack[this.undoStack.length - 1]);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this._restoreState(nextState);
        }
    }

    _restoreState(imageData) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (imageData) {
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
    }
}
