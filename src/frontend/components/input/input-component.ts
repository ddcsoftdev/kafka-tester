/**
 * Input Component
 * 
 * A web component for managing Kafka input configurations with tabs.
 */

// Declare global property for Monaco editor handler
declare global {
    interface Window {
        monacoEditorHandler?: boolean;
        monaco?: any;
    }
}

interface InputConfig {
    id: string;
    name: string;
    topic: string;
    broker: string;
    template: string;
    parameters: any[];
    isRunning: boolean;
}

export class InputComponent extends HTMLElement {
    private _vscode: any;
    private _sleep: number = 0;
    private _stopAfter: { enabled: boolean; count: number } = { enabled: false, count: 100 };
    private _configs: InputConfig[] = [];
    private _activeConfigId: string | null = null;
    private _isCollapsed: boolean = false;
    
    private tabContainer: HTMLDivElement = document.createElement('div');
    private contentContainer: HTMLDivElement = document.createElement('div');
    private mainContainer: HTMLDivElement = document.createElement('div');

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.init();
    }

    connectedCallback() {
        this.render();
    }

    set vscode(value: any) {
        this._vscode = value;
    }

    public loadState(state: any): void {
        if (state) {
            this._sleep = state.sleep || 0;
            this._stopAfter = state.stopAfter || { enabled: false, count: 100 };
            const globalRunningState = state.isRunning || false;
            this._isCollapsed = state.isCollapsed || false;
            
            if (state.configs && state.configs.length > 0) {
                this._configs = state.configs;
                this._activeConfigId = state.activeConfigId || this._configs[0].id;
            } else if (state.topic !== undefined) {
                // Legacy format - convert to new format
                this._configs = [{
                    id: crypto.randomUUID(),
                    name: 'Input 1',
                    topic: state.topic || '',
                    broker: state.broker || '',
                    template: state.template || '',
                    parameters: state.parameters || [],
                    isRunning: globalRunningState
                }];
                this._activeConfigId = this._configs[0].id;
            } else {
                this.ensureDefaultConfig();
                // Apply global running state to all configs if it was set
                if (globalRunningState) {
                    this._configs.forEach(config => {
                        config.isRunning = true;
                    });
                }
            }
            
            this.render();
        } else {
            this.ensureDefaultConfig();
        }
    }

    private init() {
        this.ensureDefaultConfig();
        this.setupBaseStructure();
    }

    private ensureDefaultConfig() {
        if (this._configs.length === 0) {
            const defaultConfig: InputConfig = {
                id: crypto.randomUUID(),
                name: 'Input 1',
                topic: '',
                broker: '',
                template: '',
                parameters: [],
                isRunning: false
            };
            this._configs.push(defaultConfig);
            this._activeConfigId = defaultConfig.id;
        }
    }

    private setupBaseStructure() {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';

        // Header section with title and global controls
        const header = document.createElement('div');
        header.className = 'input-header';
        
        const headingContainer = document.createElement('div');
        headingContainer.className = 'heading-container';
        
        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'collapse-icon';
        collapseIcon.textContent = this._isCollapsed ? '▶' : '▼';
        collapseIcon.addEventListener('click', () => this.toggleCollapse());
        
        const heading = document.createElement('h2');
        heading.textContent = 'Input';
        heading.className = 'input-heading';
        heading.addEventListener('click', () => this.toggleCollapse());
        
        headingContainer.appendChild(collapseIcon);
        headingContainer.appendChild(heading);

        // Add global control buttons
        const globalControls = document.createElement('div');
        globalControls.className = 'global-controls';
        
        const globalToggleButton = document.createElement('button');
        globalToggleButton.textContent = this.areAllRunning() ? 'Stop All' : 'Start All';
        globalToggleButton.className = 'global-toggle-btn';
        globalToggleButton.addEventListener('click', () => this.toggleAllInputs());
        
        globalControls.appendChild(globalToggleButton);
        
        header.appendChild(headingContainer);
        header.appendChild(globalControls);

        // Main container for collapsible content
        this.mainContainer = document.createElement('div');
        this.mainContainer.className = `main-container${this._isCollapsed ? ' collapsed' : ''}`;
        
        // Add button (now inside collapsible section)
        const addButtonContainer = document.createElement('div');
        addButtonContainer.className = 'add-button-container';
        
        const addButton = document.createElement('button');
        addButton.textContent = '+ Add Input';
        addButton.className = 'add-config-btn';
        addButton.addEventListener('click', () => this.addConfig());
        
        addButtonContainer.appendChild(addButton);
        
        // Tab container
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'tab-container';
        
        // Content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'content-container';

        this.mainContainer.appendChild(addButtonContainer);
        this.mainContainer.appendChild(this.tabContainer);
        this.mainContainer.appendChild(this.contentContainer);
        
        wrapper.appendChild(header);
        wrapper.appendChild(this.mainContainer);

        this.shadowRoot!.appendChild(wrapper);
    }

    private toggleCollapse() {
        this._isCollapsed = !this._isCollapsed;
        
        // Update collapse icon and main container visibility
        const collapseIcon = this.shadowRoot?.querySelector('.collapse-icon');
        if (collapseIcon) {
            collapseIcon.textContent = this._isCollapsed ? '▶' : '▼';
        }
        
        if (this.mainContainer) {
            this.mainContainer.className = `main-container${this._isCollapsed ? ' collapsed' : ''}`;
        }
        
        this.notifyStateChange();
    }

    private render() {
        if (!this.shadowRoot) return;

        // Add styles
        const styleElement = this.shadowRoot.querySelector('style') || document.createElement('style');
        styleElement.textContent = this.getStyles();
        if (!styleElement.parentNode) {
            this.shadowRoot.appendChild(styleElement);
        }
        
        // Update collapse state
        const collapseIcon = this.shadowRoot.querySelector('.collapse-icon');
        if (collapseIcon) {
            collapseIcon.textContent = this._isCollapsed ? '▶' : '▼';
        }
        
        // Update global toggle button
        const globalToggleButton = this.shadowRoot.querySelector('.global-toggle-btn');
        if (globalToggleButton) {
            globalToggleButton.textContent = this.areAllRunning() ? 'Stop All' : 'Start All';
        }
        
        if (this.mainContainer) {
            this.mainContainer.className = `main-container${this._isCollapsed ? ' collapsed' : ''}`;
        }
        
        // If collapsed, don't bother rendering the content
        if (this._isCollapsed) return;
        
        // Render tabs
        this.renderTabs();
        
        // Render active config content
        if (this._activeConfigId) {
            this.renderConfigContent(this._activeConfigId);
        } else if (this._configs.length > 0) {
            this._activeConfigId = this._configs[0].id;
            this.renderConfigContent(this._activeConfigId);
        }
    }

    private renderTabs() {
        this.tabContainer.innerHTML = '';
        
        this._configs.forEach(config => {
            const tab = this.createTabElement(config);
            this.tabContainer.appendChild(tab);
        });
    }

    private createTabElement(config: InputConfig): HTMLElement {
        const tab = document.createElement('div');
        tab.className = `tab${config.id === this._activeConfigId ? ' active' : ''}`;
        
        tab.innerHTML = `
            <span class="tab-name ${config.isRunning ? 'running' : ''}">${config.name}</span>
            ${this._configs.length > 1 ? '<button class="tab-close">×</button>' : ''}
        `;

        tab.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).matches('.tab-close')) {
                this._activeConfigId = config.id;
                this.render();
            }
        });

        const nameSpan = tab.querySelector('.tab-name');
        nameSpan?.addEventListener('dblclick', () => {
            this.startTabRename(config);
        });

        tab.querySelector('.tab-close')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeConfig(config.id);
        });

        return tab;
    }

    private startTabRename(config: InputConfig) {
        const activeTab = this.tabContainer.querySelector(`.tab[class*="active"]`);
        if (!activeTab) return;
        
        const nameSpan = activeTab.querySelector('.tab-name');
        if (!nameSpan) return;
        
        const currentName = nameSpan.textContent || '';
        
        // Replace span with input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'tab-rename-input';
        
        // Handle input events
        const finishRename = () => {
            const newName = input.value.trim() || 'Unnamed';
            config.name = newName;
            this.notifyStateChange();
            this.render();
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishRename();
            } else if (e.key === 'Escape') {
                this.render(); // Cancel and revert
            }
        });
        
        nameSpan.replaceWith(input);
        input.focus();
        input.select();
    }

    private renderConfigContent(configId: string) {
        const config = this._configs.find(c => c.id === configId);
        if (!config) return;

        this.contentContainer.innerHTML = '';
        
        // Stream controls
        const streamControls = document.createElement('div');
        streamControls.className = 'stream-controls';
        streamControls.innerHTML = `
            <div class="sleep-container">
                <label>Sleep (ms):</label>
                <input type="number" class="sleep-input" min="0" value="${this._sleep}">
            </div>
            <div class="stop-after-container">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="stop-after-checkbox" class="stop-after-checkbox" ${this._stopAfter.enabled ? 'checked' : ''}>
                    <label for="stop-after-checkbox">Stop after</label>
                </div>
                <input type="number" 
                       class="stop-after-input ${!this._stopAfter.enabled ? 'disabled' : ''}" 
                       min="1" 
                       value="${this._stopAfter.count}" 
                       ${!this._stopAfter.enabled ? 'disabled' : ''}
                       aria-label="Number of events to stop after">
                <label class="${!this._stopAfter.enabled ? 'disabled-text' : ''}">events</label>
            </div>
        `;

        // Topic and broker
        const topicBrokerRow = document.createElement('div');
        topicBrokerRow.className = 'row';
        topicBrokerRow.innerHTML = `
            <div class="form-group">
                <label class="form-label">Topic</label>
                <input type="text" class="topic-input" placeholder="Enter topic name" value="${config.topic}">
            </div>
            <div class="form-group">
                <label class="form-label">Broker Address</label>
                <input type="text" class="broker-input" placeholder="localhost:9092" value="${config.broker}">
            </div>
        `;

        // Template with Simple JSON Editor
        const templateGroup = document.createElement('div');
        templateGroup.className = 'form-group';
        
        const templateLabel = document.createElement('label');
        templateLabel.className = 'form-label';
        templateLabel.textContent = 'JSON Template';
        templateGroup.appendChild(templateLabel);
        
        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.className = 'json-editor-container';
        templateGroup.appendChild(editorContainer);
        
        // Create toolbar for the editor (optional)
        const editorToolbar = document.createElement('div');
        editorToolbar.className = 'json-editor-toolbar';
        
        const formatButton = document.createElement('button');
        formatButton.className = 'json-editor-btn format-btn';
        formatButton.textContent = 'Format JSON';
        formatButton.title = 'Format JSON with proper indentation (optional)';
        
        editorToolbar.appendChild(formatButton);
        editorContainer.appendChild(editorToolbar);
        
        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'json-editor-status';
        statusIndicator.textContent = 'Ready';
        editorContainer.appendChild(statusIndicator);
        
        // Create a simple textarea for JSON editing
        const editorTextarea = document.createElement('textarea');
        editorTextarea.className = 'json-editor-textarea';
        editorTextarea.id = `editor-${config.id}`;
        editorTextarea.spellcheck = false;
        editorTextarea.value = config.template || '';
        editorContainer.appendChild(editorTextarea);
        
        // Add event listeners for the editor
        editorTextarea.addEventListener('input', (e) => {
            const value = editorTextarea.value;
            config.template = value;
            this.notifyStateChange();
        });
        
        // Format button functionality (optional)
        formatButton.addEventListener('click', () => {
            try {
                const value = editorTextarea.value.trim();
                if (!value) return;
                
                const formatted = this.formatJson(value);
                if (formatted) {
                    editorTextarea.value = formatted;
                    config.template = formatted;
                    this.notifyStateChange();
                    
                    statusIndicator.textContent = 'JSON formatted successfully';
                    statusIndicator.className = 'json-editor-status success';
                    setTimeout(() => {
                        statusIndicator.textContent = 'Ready';
                        statusIndicator.className = 'json-editor-status';
                    }, 2000);
                }
            } catch (error: any) {
                statusIndicator.textContent = `Error: ${error.message}`;
                statusIndicator.className = 'json-editor-status error';
            }
        });

        // Parameters section
        const paramSection = document.createElement('div');
        paramSection.className = 'param-section';
        
        // Create parameter component
        const paramComponent = document.createElement('parameter-component');
        paramSection.appendChild(paramComponent);
        
        // Start/Stop button
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'form-group';
        buttonGroup.innerHTML = `
            <button class="toggle-pause-btn">${config.isRunning ? 'Stop' : 'Start'}</button>
        `;

        // Append all sections
        this.contentContainer.appendChild(streamControls);
        this.contentContainer.appendChild(topicBrokerRow);
        this.contentContainer.appendChild(templateGroup);
        this.contentContainer.appendChild(paramSection);
        this.contentContainer.appendChild(buttonGroup);

        // Add event listeners
        this.addContentEventListeners(config);
        
        // Set parameters to parameter component
        if (paramComponent instanceof HTMLElement) {
            // Set parameters if the component has the method
            if ('setParameters' in paramComponent) {
                (paramComponent as any).setParameters(config.parameters);
            }
            
            // Set callback to update parameters
            if ('parametersCallback' in paramComponent) {
                (paramComponent as any).parametersCallback = (parameters: any[]) => {
                    config.parameters = parameters;
                    this.notifyStateChange();
                };
            }
        }
        
        // Add tab handling and auto-complete for the editor
        editorTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                // Insert tab at cursor position
                const start = editorTextarea.selectionStart;
                const end = editorTextarea.selectionEnd;
                
                // Insert 2 spaces for a tab
                editorTextarea.value = editorTextarea.value.substring(0, start) + '  ' + editorTextarea.value.substring(end);
                
                // Move cursor after the inserted tab
                editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 2;
                
                // Trigger input event to update the config
                editorTextarea.dispatchEvent(new Event('input'));
            } else if (this.shouldAutoComplete(e)) {
                this.handleAutoComplete(e, editorTextarea);
            }
        });
    }
    
    private shouldAutoComplete(e: KeyboardEvent): boolean {
        // Auto-complete for opening brackets and quotes
        return ['{', '[', '"', "'"].includes(e.key);
    }
    
    private handleAutoComplete(e: KeyboardEvent, textarea: HTMLTextAreaElement): void {
        // Don't auto-complete if text is selected
        if (textarea.selectionStart !== textarea.selectionEnd) {
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
        
        const start = textarea.selectionStart;
        
        // Insert opening and closing characters
        textarea.value = 
            textarea.value.substring(0, start) + 
            e.key + closingChar + 
            textarea.value.substring(start);
        
        // Move cursor between the pair
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        
        // Trigger input event to update the config
        textarea.dispatchEvent(new Event('input'));
    }

    private formatJson(jsonString: string): string {
        try {
            // Handle empty string
            if (!jsonString.trim()) return '';
            
            // Try to parse the JSON
            let parsedJson;
            try {
                parsedJson = JSON.parse(jsonString);
            } catch (e) {
                // If it's not valid JSON, try to fix common issues
                // Replace single quotes with double quotes
                const fixedString = jsonString
                    .replace(/'/g, '"')
                    // Add quotes to unquoted keys
                    .replace(/(\s*)(\w+)\s*:/g, '$1"$2":');
                
                parsedJson = JSON.parse(fixedString);
            }
            
            // Custom formatter that keeps simple arrays on a single line
            return this.customStringify(parsedJson, 2);
        } catch (error) {
            // Return the original string if parsing fails
            console.error("JSON formatting error:", error);
            return jsonString;
        }
    }

    private customStringify(obj: any, indent: number): string {
        // Helper function to check if an array contains only primitive values
        const isSimpleArray = (arr: any[]): boolean => {
            return Array.isArray(arr) && arr.every(item => 
                typeof item === 'number' || 
                typeof item === 'string' || 
                typeof item === 'boolean' || 
                item === null
            );
        };
        
        // Process the object with a custom formatter
        const processValue = (value: any, level: number): string => {
            const indentation = '  '.repeat(level);
            
            if (Array.isArray(value)) {
                if (isSimpleArray(value)) {
                    // Format simple arrays on a single line
                    const items = value.map(item => {
                        if (typeof item === 'string') {
                            return `"${item.replace(/"/g, '\\"')}"`;
                        }
                        return String(item);
                    }).join(', ');
                    return `[${items}]`;
                } else {
                    // Format complex arrays with items on separate lines
                    const items = value.map(item => 
                        `${indentation}  ${processValue(item, level + 1)}`
                    ).join(',\n');
                    return `[\n${items}\n${indentation}]`;
                }
            } else if (value !== null && typeof value === 'object') {
                // Format objects with properties on separate lines
                const properties = Object.keys(value).map(key => 
                    `${indentation}  "${key}": ${processValue(value[key], level + 1)}`
                ).join(',\n');
                return `{\n${properties}\n${indentation}}`;
            } else if (typeof value === 'string') {
                return `"${value.replace(/"/g, '\\"')}"`;
            } else {
                return String(value);
            }
        };
        
        try {
            return processValue(obj, 0);
        } catch (error) {
            // Fallback to standard JSON.stringify if custom formatting fails
            return JSON.stringify(obj, null, indent);
        }
    }

    private addContentEventListeners(config: InputConfig) {
        // Stream controls
        const sleepInput = this.contentContainer.querySelector('.sleep-input');
        const stopAfterCheckbox = this.contentContainer.querySelector('.stop-after-checkbox');
        const stopAfterInput = this.contentContainer.querySelector('.stop-after-input');
        const stopAfterLabel = this.contentContainer.querySelector('.stop-after-container label:last-child');

        sleepInput?.addEventListener('change', (e) => {
            this._sleep = parseInt((e.target as HTMLInputElement).value) || 0;
            this.notifyStateChange();
        });

        stopAfterCheckbox?.addEventListener('change', (e) => {
            this._stopAfter.enabled = (e.target as HTMLInputElement).checked;
            
            // Update the input field state
            if (stopAfterInput) {
                const inputElement = stopAfterInput as HTMLInputElement;
                inputElement.disabled = !this._stopAfter.enabled;
                
                // Toggle the disabled class
                if (this._stopAfter.enabled) {
                    inputElement.classList.remove('disabled');
                    stopAfterLabel?.classList.remove('disabled-text');
                    // Focus the input field when enabled
                    setTimeout(() => inputElement.focus(), 0);
                } else {
                    inputElement.classList.add('disabled');
                    stopAfterLabel?.classList.add('disabled-text');
                }
            }
            
            this.notifyStateChange();
        });

        stopAfterInput?.addEventListener('change', (e) => {
            this._stopAfter.count = parseInt((e.target as HTMLInputElement).value) || 100;
            this.notifyStateChange();
        });

        // Topic and broker inputs
        const topicInput = this.contentContainer.querySelector('.topic-input');
        const brokerInput = this.contentContainer.querySelector('.broker-input');

        topicInput?.addEventListener('input', (e) => {
            config.topic = (e.target as HTMLInputElement).value;
            this.notifyStateChange();
        });

        brokerInput?.addEventListener('input', (e) => {
            config.broker = (e.target as HTMLInputElement).value;
            this.notifyStateChange();
        });

        // Start/Stop button
        const toggleButton = this.contentContainer.querySelector('.toggle-pause-btn');
        toggleButton?.addEventListener('click', () => {
            config.isRunning = !config.isRunning;
            this.notifyStateChange();
            this.render();
        });
    }

    private addConfig() {
        const newConfig: InputConfig = {
            id: crypto.randomUUID(),
            name: `Input ${this._configs.length + 1}`,
            topic: '',
            broker: '',
            template: '',
            parameters: [],
            isRunning: false
        };
        
        this._configs.push(newConfig);
        this._activeConfigId = newConfig.id;
        this.notifyStateChange();
        this.render();
    }

    private removeConfig(configId: string) {
        // Don't remove if it's the last config
        if (this._configs.length <= 1) return;
        
        const index = this._configs.findIndex(c => c.id === configId);
        if (index !== -1) {
            this._configs.splice(index, 1);
            
            // Update active config
            if (this._activeConfigId === configId) {
                this._activeConfigId = this._configs.length > 0 ? this._configs[0].id : null;
            }
            
            this.notifyStateChange();
            this.render();
        }
    }

    private notifyStateChange() {
        this._vscode?.postMessage({
            type: 'stateChanged',
            data: {
                configs: this._configs,
                activeConfigId: this._activeConfigId,
                sleep: this._sleep,
                stopAfter: this._stopAfter,
                isRunning: this.areAllRunning(), // For backward compatibility
                isCollapsed: this._isCollapsed
            }
        });
    }

    private toggleAllInputs() {
        const newState = !this.areAllRunning();
        this._configs.forEach(config => {
            config.isRunning = newState;
        });
        this.notifyStateChange();
        this.render();
    }

    private areAllRunning(): boolean {
        return this._configs.length > 0 && this._configs.every(config => config.isRunning);
    }

    private getStyles(): string {
        return `
            :host {
                display: block;
                width: 100%;
                box-sizing: border-box;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }

            .input-wrapper {
                background: var(--vscode-editor-background);
                border-radius: 4px;
                padding: 12px;
                border: 1px solid var(--vscode-panel-border);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                margin-bottom: 16px;
            }

            .input-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                background: rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.6);
                padding: 6px 8px;
                border-radius: 3px;
                border-left: 3px solid var(--vscode-activityBarBadge-background, #007acc);
            }
            
            .heading-container {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
            }
            
            .global-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .global-toggle-btn {
                padding: 3px 8px;
                border: 1px solid var(--vscode-button-border);
                border-radius: 2px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                font-size: var(--vscode-font-size);
                cursor: pointer;
                white-space: nowrap;
            }
            
            .global-toggle-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
            
            .collapse-icon {
                font-size: 10px;
                color: var(--vscode-foreground);
                opacity: 0.7;
                transition: transform 0.2s ease;
            }

            .input-heading {
                margin: 0;
                font-size: var(--vscode-font-size);
                font-weight: 600;
                color: var(--vscode-foreground);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: pointer;
            }
            
            .main-container {
                transition: max-height 0.3s ease, opacity 0.2s ease;
                max-height: 2000px;
                opacity: 1;
                overflow: hidden;
                background: rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.3);
                border-radius: 3px;
                padding: 12px;
            }
            
            .main-container.collapsed {
                max-height: 0;
                opacity: 0;
                margin-top: 0;
                margin-bottom: 0;
                padding-top: 0;
                padding-bottom: 0;
            }
            
            .add-button-container {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 12px;
            }

            .add-config-btn {
                padding: 3px 8px;
                border: 1px solid var(--vscode-button-border);
                border-radius: 2px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                font-size: var(--vscode-font-size);
                cursor: pointer;
            }

            .add-config-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }

            .tab-container {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
                flex-wrap: wrap;
                border-bottom: 1px solid var(--vscode-widget-border);
                padding-bottom: 8px;
            }

            .tab {
                padding: 4px 8px;
                border: 1px solid var(--vscode-widget-border);
                border-radius: 3px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                background: var(--vscode-editor-background);
                font-size: var(--vscode-font-size);
                transition: all 0.1s ease;
            }

            .tab:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .tab.active {
                background: var(--vscode-list-activeSelectionBackground);
                color: var(--vscode-list-activeSelectionForeground);
            }

            .tab-close {
                border: none;
                background: none;
                cursor: pointer;
                padding: 1px 4px;
                border-radius: 2px;
                color: var(--vscode-icon-foreground);
                font-size: 12px;
                line-height: 1;
            }

            .tab-close:hover {
                background: var(--vscode-toolbar-hoverBackground);
            }

            .tab-rename-input {
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                font-size: var(--vscode-font-size);
                padding: 1px 4px;
                max-width: 120px;
            }

            .stream-controls {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
                padding: 8px 12px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
            }

            .sleep-container {
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
            }

            .stop-after-container {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
                white-space: nowrap;
            }

            .stop-after-input.disabled {
                opacity: 0.5;
                background-color: var(--vscode-disabledForeground, rgba(120, 120, 120, 0.3));
                color: var(--vscode-disabledForeground, #888);
                cursor: not-allowed;
            }

            .disabled-text {
                opacity: 0.5;
                color: var(--vscode-disabledForeground, #888);
            }

            .row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 16px;
                background: rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.4);
                padding: 12px;
                border-radius: 3px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-label {
                display: block;
                margin-bottom: 6px;
                color: var(--vscode-foreground);
                font-weight: 500;
                font-size: var(--vscode-font-size);
            }

            input[type="text"],
            input[type="number"] {
                padding: 4px 8px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
            }

            input[type="text"] {
                width: 100%;
                box-sizing: border-box;
            }

            input[type="number"] {
                width: 80px;
            }

            input[type="checkbox"] {
                width: 14px;
                height: 14px;
                border: 1px solid var(--vscode-widget-border);
                border-radius: 2px;
                cursor: pointer;
                background: var(--vscode-input-background);
            }

            textarea.template-input {
                width: 100%;
                min-height: 200px;
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                font-family: var(--vscode-editor-font-family, monospace);
                font-size: 13px;
                line-height: 1.5;
                resize: vertical;
                box-sizing: border-box;
                tab-size: 2;
            }

            .json-editor-container {
                width: 100%;
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                overflow: hidden;
                background: var(--vscode-editor-background);
                display: flex;
                flex-direction: column;
            }
            
            .json-editor-toolbar {
                display: flex;
                padding: 4px 8px;
                background: var(--vscode-editor-background);
                border-bottom: 1px solid var(--vscode-panel-border);
                gap: 8px;
            }
            
            .json-editor-btn {
                padding: 2px 8px;
                background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
                color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
                border: 1px solid var(--vscode-button-border);
                border-radius: 2px;
                font-size: 11px;
                cursor: pointer;
            }
            
            .json-editor-btn:hover {
                background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
            }
            
            .json-editor-status {
                padding: 2px 8px;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                background: var(--vscode-editor-background);
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .json-editor-status.error {
                color: var(--vscode-errorForeground, #f48771);
                background: var(--vscode-inputValidation-errorBackground, rgba(244, 135, 113, 0.1));
                border-color: var(--vscode-inputValidation-errorBorder, #f48771);
            }
            
            .json-editor-status.success {
                color: var(--vscode-terminal-ansiGreen, #89d185);
                background: var(--vscode-inputValidation-infoBackground, rgba(137, 209, 133, 0.1));
                border-color: var(--vscode-inputValidation-infoBorder, #89d185);
            }
            
            .json-editor-wrapper {
                position: relative;
                width: 100%;
                height: 300px;
            }
            
            .json-editor-textarea {
                width: 100%;
                height: 300px;
                padding: 8px 12px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                border: none;
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                resize: vertical;
                box-sizing: border-box;
                tab-size: 2;
                outline: none;
                white-space: pre;
            }
            
            .json-preview {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 8px 12px;
                background: var(--vscode-editor-background);
                border: none;
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                overflow: auto;
                box-sizing: border-box;
                tab-size: 2;
                white-space: pre;
                pointer-events: none;
                z-index: 1;
            }

            .param-section {
                margin-bottom: 16px;
                padding: 12px;
                border: none;
                background: rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.5);
                border-radius: 3px;
            }

            .toggle-pause-btn {
                padding: 6px 12px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: 1px solid var(--vscode-button-border);
                border-radius: 2px;
                cursor: pointer;
                font-weight: 500;
                font-size: var(--vscode-font-size);
            }

            .toggle-pause-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }

            .tab-name.running {
                color: var(--vscode-testing-runAction, #4CAF50);
                font-weight: 600;
            }

            .json-key {
                color: #9CDCFE; /* Blue for keys */
            }
            
            .json-string {
                color: #CE9178; /* Orange for strings */
            }
            
            .json-number {
                color: #B5CEA8; /* Green for numbers */
            }
            
            .json-boolean {
                color: #C586C0; /* Purple for booleans and null */
            }
        `;
    }
}

customElements.define('input-component', InputComponent); 