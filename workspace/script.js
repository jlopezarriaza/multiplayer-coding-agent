// --- Canvas Manager ---
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas dimensions (can be dynamic)
canvas.width = 800;
canvas.height = 600;

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
// Set initial lineWidth consistent with currentBrushSize, will be defined below
ctx.lineWidth = 5; 

// --- Color Manager ---
let currentColor = document.getElementById('colorPicker').value;

document.getElementById('colorPicker').addEventListener('input', (e) => {
    currentColor = e.target.value;
    ctx.strokeStyle = currentColor;
});

// --- Tool Manager ---
let activeTool = 'pencil'; // 'pencil', 'eraser', 'line'
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Store starting point for line tool
let startX = 0;
let startY = 0;

// Initialize currentBrushSize and savedCanvasState
let currentBrushSize = 5; // Initialize with default brush size
let savedCanvasState; // To store canvas image data for line tool preview

// --- UI Event Handlers ---
document.querySelectorAll('.tool-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        button.classList.add('active');
        activeTool = button.id; // Set active tool based on button id
        
        // Update cursor based on tool
        if (activeTool === 'eraser') {
            canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' fill=\'black\'><rect x=\'0\' y=\'0\' width=\'20\' height=\'20\' fill=\'white\' stroke=\'black\' stroke-width=\'1\'/></svg>") 10 10, auto';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    });
});

// Handle Brush Size Input
const brushSizeInput = document.getElementById('brushSize');
brushSizeInput.addEventListener('input', (e) => {
    currentBrushSize = parseInt(e.target.value);
    // ctx.lineWidth is updated in mousemove/mouseup for each tool
});

// Handle Clear Canvas Button Click
document.getElementById('clearCanvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    [startX, startY] = [e.offsetX, e.offsetY]; // For line tool
    
    // If it's pencil or eraser, start drawing immediately
    if (activeTool === 'pencil' || activeTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    } else if (activeTool === 'line') {
        savedCanvasState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    if (activeTool === 'pencil') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentBrushSize; // Use currentBrushSize
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    } else if (activeTool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF'; // Eraser color is white
        ctx.lineWidth = currentBrushSize * 3; // Eraser is typically thicker, use multiplier
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    } else if (activeTool === 'line') {
        // Restore the canvas to the state before the current line preview started
        ctx.putImageData(savedCanvasState, 0, 0); 
        
        // Draw the temporary line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentBrushSize;
        ctx.stroke();
    }
});

canvas.addEventListener('mouseup', (e) => {
    isDrawing = false;
    if (activeTool === 'line') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentBrushSize; // Use currentBrushSize
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
    // No ctx.closePath() here for pencil/eraser. It's not needed for continuous strokes.
});

canvas.addEventListener('mouseout', () => {
    isDrawing = false;
    // No ctx.closePath() here.
});