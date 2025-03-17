/**
 * Terminal Component
 * 
 * A simplified web component for JSON editing.
 */

/**
 * Custom event for terminal input changes
 */
export class TerminalInputEvent extends CustomEvent<{ content: string }> {
  constructor(content: string) {
    super('terminalInput', {
      detail: { content },
      bubbles: true,
      composed: true
    });
  }
}

/**
 * TerminalComponent - A web component for JSON editing
 * 
 * Features:
 * - Simple text editing with syntax highlighting
 * - Auto-complete for brackets and quotes
 * - Tab support for indentation
 */
export class TerminalComponent extends HTMLElement {
  // DOM Elements
  private editorContainer: HTMLDivElement;
  private inputField: HTMLTextAreaElement;
  
  // State
  private _content: string = '';
  private _vscode: any;
  
  // Theme variables
  private readonly theme = {
    background: 'var(--vscode-terminal-background, var(--vscode-editor-background))',
    foreground: 'var(--vscode-terminal-foreground, var(--vscode-editor-foreground))',
    font: 'var(--vscode-editor-font-family, monospace)',
    fontSize: 'var(--vscode-editor-font-size, 13px)',
    border: 'var(--vscode-panel-border)',
  };

  /**
   * Constructor - Initialize the component
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize DOM elements
    this.editorContainer = document.createElement('div');
    this.inputField = document.createElement('textarea');
    
    this.init();
  }

  /**
   * Connected callback - Called when the element is added to the DOM
   */
  connectedCallback() {
    this.render();
  }

  /**
   * Set VSCode API reference
   */
  set vscode(value: any) {
    this._vscode = value;
  }

  /**
   * Get the current content of the terminal
   */
  public getContent(): string {
    return this._content;
  }

  /**
   * Add a text message to the editor
   */
  public addTextMessage(content: string, type: string = 'input'): void {
    this._content = content;
    this.inputField.value = content;
    this.dispatchEvent(new TerminalInputEvent(content));
  }

  /**
   * Clear all content
   */
  public clearMessages(): void {
    this._content = '';
    this.inputField.value = '';
    this.dispatchEvent(new TerminalInputEvent(''));
  }

  /**
   * Initialize the component
   */
  private init() {
    this.setupBaseStructure();
    this.setupStyles();
  }

  /**
   * Set up the base DOM structure
   */
  private setupBaseStructure() {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-wrapper';

    // Editor container
    this.editorContainer.className = 'editor-container';
    this.setupInputField();
    this.editorContainer.appendChild(this.inputField);

    wrapper.appendChild(this.editorContainer);
    this.shadowRoot!.appendChild(wrapper);
  }

  /**
   * Set up the input field
   */
  private setupInputField() {
    this.inputField.className = 'editor-input';
    this.inputField.placeholder = 'Enter JSON here...';
    this.inputField.spellcheck = false;
    
    // Add event listeners
    this.inputField.addEventListener('input', () => {
      this._content = this.inputField.value;
      this.dispatchEvent(new TerminalInputEvent(this._content));
    });
    
    // Add tab and auto-complete handling
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        
        // Insert tab at cursor position
        const start = this.inputField.selectionStart;
        const end = this.inputField.selectionEnd;
        
        // Insert 2 spaces for a tab
        this.inputField.value = 
          this.inputField.value.substring(0, start) + 
          '  ' + 
          this.inputField.value.substring(end);
        
        // Move cursor after the inserted tab
        this.inputField.selectionStart = this.inputField.selectionEnd = start + 2;
        
        // Trigger input event
        this.inputField.dispatchEvent(new Event('input'));
      } else if (this.shouldAutoComplete(e)) {
        this.handleAutoComplete(e);
      }
    });
  }

  /**
   * Check if auto-complete should be triggered
   */
  private shouldAutoComplete(e: KeyboardEvent): boolean {
    // Auto-complete for opening brackets and quotes
    return ['{', '[', '"', "'"].includes(e.key);
  }

  /**
   * Handle auto-complete for brackets and quotes
   */
  private handleAutoComplete(e: KeyboardEvent): void {
    // Don't auto-complete if text is selected
    if (this.inputField.selectionStart !== this.inputField.selectionEnd) {
      return;
    }
    
    // Define matching pairs
    const pairs: {[key: string]: string} = {
      '{': '}',
      '[': ']',
      '"': '"',
      "'": "'"
    };
    
    // Get the closing character for the pressed key
    const closingChar = pairs[e.key];
    
    // Insert the pair
    e.preventDefault();
    
    const start = this.inputField.selectionStart;
    
    // Insert opening and closing characters
    this.inputField.value = 
      this.inputField.value.substring(0, start) + 
      e.key + closingChar + 
      this.inputField.value.substring(start);
    
    // Move cursor between the pair
    this.inputField.selectionStart = this.inputField.selectionEnd = start + 1;
    
    // Trigger input event
    this.inputField.dispatchEvent(new Event('input'));
  }

  /**
   * Set up the component styles
   */
  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot!.appendChild(style);
  }

  /**
   * Render the component
   */
  private render() {
    // Nothing to render dynamically
  }

  /**
   * Get the component styles
   */
  private getStyles(): string {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }

      .terminal-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: ${this.theme.background};
        border-radius: 3px;
        overflow: hidden;
        font-family: ${this.theme.font};
        font-size: ${this.theme.fontSize};
        color: ${this.theme.foreground};
      }

      .editor-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .editor-input {
        width: 100%;
        height: 100%;
        padding: 8px;
        background: ${this.theme.background};
        color: ${this.theme.foreground};
        border: none;
        font-family: ${this.theme.font};
        font-size: ${this.theme.fontSize};
        resize: none;
        outline: none;
        box-sizing: border-box;
        line-height: 1.5;
        tab-size: 2;
      }
      
      .editor-input:focus {
        outline: none;
      }
    `;
  }
}

// Register the custom element
customElements.define('terminal-component', TerminalComponent); 