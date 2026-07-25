// js/ui.js

export class UIManager {
    constructor(appState, canvasManager, historyManager, tools) {
        this.appState = appState;
        this.canvasManager = canvasManager;
        this.historyManager = historyManager;
        this.tools = tools;

        this.toolbar = document.querySelector('.toolbar');
        this.colorPicker = document.getElementById('color-picker');
        this.brushSizeInput = document.getElementById('brush-size');
        this.colorSwatches = document.querySelectorAll('.color-swatch');
        this.fillShapeButton = document.getElementById('fill-shape');
        this.undoButton = document.getElementById('undo');
        this.redoButton = document.getElementById('redo');
        this.newCanvasButton = document.getElementById('new-canvas');
        this.saveImageButton = document.getElementById('save-image');
    }

    init() {
        this.attachEventListeners();
        this.updateUI();
    }

    attachEventListeners() {
        this.toolbar.addEventListener('click', this.handleToolbarClick);
        this.colorPicker.addEventListener('input', this.handleColorPickerChange);
        this.brushSizeInput.addEventListener('input', this.handleBrushSizeChange);
        this.fillShapeButton.addEventListener('click', this.handleFillShapeToggle);
        this.undoButton.addEventListener('click', this.handleUndo);
        this.redoButton.addEventListener('click', this.handleRedo);
        this.newCanvasButton.addEventListener('click', this.handleNewCanvas);
        this.saveImageButton.addEventListener('click', this.handleSaveImage);
    }

    handleToolbarClick = (e) => {
        const targetButton = e.target.closest('.tool-button[data-tool]');
        if (targetButton) {
            const toolName = targetButton.dataset.tool;
            this.appState.currentTool = toolName;
            this.canvasManager.setActiveTool(this.tools[toolName]);
            this.updateToolButtons(toolName);
        }
    };

    handleColorPickerChange = (e) => {
        this.appState.currentColor = e.target.value;
        this.updateColorSwatches(e.target.value);
        this.canvasManager.setDrawingStyle();
    };

    handleBrushSizeChange = (e) => {
        this.appState.brushSize = parseInt(e.target.value);
        this.canvasManager.setDrawingStyle();
    };

    handleFillShapeToggle = () => {
        this.appState.fillShape = !this.appState.fillShape;
        this.fillShapeButton.classList.toggle('active', this.appState.fillShape);
    };

    handleUndo = () => {
        this.historyManager.undo();
    };

    handleRedo = () => {
        this.historyManager.redo();
    };

    handleNewCanvas = () => {
        if (confirm('Are you sure you want to start a new canvas? Unsaved changes will be lost.')) {
            this.canvasManager.clearCanvas();
            this.historyManager.clearHistory();
            this.historyManager.saveState(); // Save initial blank state
        }
    };

    handleSaveImage = () => {
        const dataURL = this.canvasManager.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `paint-drawing-${new Date().toISOString().slice(0,10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    updateUI() {
        // Set initial active tool button
        this.updateToolButtons(this.appState.currentTool);
        // Set initial color picker and active swatch
        this.colorPicker.value = this.appState.currentColor;
        this.updateColorSwatches(this.appState.currentColor);
        // Set initial brush size
        this.brushSizeInput.value = this.appState.brushSize;
        // Set initial fill shape button state
        this.fillShapeButton.classList.toggle('active', this.appState.fillShape);
    }

    updateToolButtons(activeToolName) {
        document.querySelectorAll('.tool-button[data-tool]').forEach(button => {
            if (button.dataset.tool === activeToolName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    updateColorSwatches(activeColor) {
        this.colorSwatches.forEach(swatch => {
            // Normalize colors for comparison (e.g., #000000 vs black)
            const swatchColor = this.rgbToHex(window.getComputedStyle(swatch).backgroundColor);
            if (swatchColor === this.rgbToHex(activeColor)) {
                swatch.classList.add('active');
            } else {
                swatch.classList.remove('active');
            }
        });

        // Handle color picker if it's not the source of change
        if (this.colorPicker.value !== activeColor) {
            this.colorPicker.value = activeColor;
        }
    }

    // Helper to convert RGB to Hex for consistent comparison
    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb.toLowerCase();

        const parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!parts) return rgb;

        const r = parseInt(parts[1], 10);
        const g = parseInt(parts[2], 10);
        const b = parseInt(parts[3], 10);

        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toLowerCase();
    }
}
