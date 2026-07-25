// js/main.js

import { CanvasManager } from './canvas.js';
import { HistoryManager } from './history.js';
import { UIManager } from './ui.js';
import { PencilTool, EraserTool, LineTool, RectangleTool, CircleTool, FillTool, TextTool } from './tools.js';

const AppState = {
    currentColor: 'black',
    brushSize: 5,
    currentTool: 'pencil',
    fillShape: false, // For rectangle/circle outlined or filled
};

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('2D context not supported!');
        return;
    }

    const canvasManager = new CanvasManager(canvas, ctx, AppState);
    const historyManager = new HistoryManager(canvas, ctx);

    // Initialize tools
    const tools = {
        pencil: new PencilTool(canvasManager, AppState, historyManager),
        eraser: new EraserTool(canvasManager, AppState, historyManager),
        line: new LineTool(canvasManager, AppState, historyManager),
        rectangle: new RectangleTool(canvasManager, AppState, historyManager),
        circle: new CircleTool(canvasManager, AppState, historyManager),
        fill: new FillTool(canvasManager, AppState, historyManager),
        text: new TextTool(canvasManager, AppState, historyManager),
    };

    const uiManager = new UIManager(AppState, canvasManager, historyManager, tools);

    canvasManager.init();
    historyManager.saveState(); // Save initial blank canvas state
    uiManager.init();

    // Set initial tool
    canvasManager.setActiveTool(tools[AppState.currentTool]);
});
