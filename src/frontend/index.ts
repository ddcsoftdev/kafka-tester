// Import components
import './components/header/header-component.js';
import './components/input/input-component.js';
import './components/output/output-component.js';
import './components/parameters/parameter-component.js';
import './components/terminal/terminal-component.js';


// Initialize VS Code API
declare global {
    interface Window {
        acquireVsCodeApi: () => any;
    }
}

// Get VS Code API instance
const vscode = window.acquireVsCodeApi();

// Export for use in other modules
export { vscode }; 