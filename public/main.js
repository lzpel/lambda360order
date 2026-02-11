console.log('Lambda360 Loader: main.js loaded from GitHub Pages!');
// In the future, this script will:
// 1. Detect the container element (e.g., #lambda360-viewer-container)
// 2. Create an iframe or mount the React app into that container
// 3. Load the 3D model specified in data attributes

const container = document.getElementById('lambda360-viewer-container');
if (container) {
    container.innerHTML = '<div style="background:#eee; padding:20px; text-align:center;">Lambda360 Viewer loaded via main.js!</div>';
    container.style.border = '2px solid #0066cc';
}
