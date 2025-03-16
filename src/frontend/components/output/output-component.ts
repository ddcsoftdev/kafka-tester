/// <reference lib="dom" />

interface OutputConfig {
    id: string;
    name: string;
    topic: string;
    broker: string;
    isConnected: boolean;
    messages: string[];
}

export class OutputComponent extends HTMLElement {
    private _vscode: any;
    private _configs: OutputConfig[] = [];
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
            this._isCollapsed = state.isCollapsed || false;
            
            if (state.configs && state.configs.length > 0) {
                this._configs = state.configs;
                this._activeConfigId = state.activeConfigId || this._configs[0].id;
            } else if (state.topic !== undefined) {
                // Legacy format - convert to new format
                this._configs = [{
                    id: crypto.randomUUID(),
                    name: 'Output 1',
                    topic: state.topic || '',
                    broker: state.broker || '',
                    isConnected: state.isConnected || false,
                    messages: state.messages || []
                }];
                this._activeConfigId = this._configs[0].id;
            } else {
                this.ensureDefaultConfig();
            }
            
            this.render();
        } else {
            this.ensureDefaultConfig();
        }
    }

    public addMessage(message: string): void {
        if (!this._activeConfigId) return;
        
        const config = this._configs.find(c => c.id === this._activeConfigId);
        if (config) {
            config.messages.push(message);
            this.render();
            
            // Scroll to bottom after adding new message
            if (this.shadowRoot) {
                const messages = this.shadowRoot.querySelector('.messages');
                if (messages) {
                    messages.scrollTop = messages.scrollHeight;
                }
            }
        }
    }

    private init() {
        this.ensureDefaultConfig();
        this.setupBaseStructure();
    }

    private ensureDefaultConfig() {
        if (this._configs.length === 0) {
            const defaultConfig: OutputConfig = {
                id: crypto.randomUUID(),
                name: 'Output 1',
                topic: '',
                broker: '',
                isConnected: false,
                messages: []
            };
            this._configs.push(defaultConfig);
            this._activeConfigId = defaultConfig.id;
        }
    }

    private setupBaseStructure() {
        const wrapper = document.createElement('div');
        wrapper.className = 'output-wrapper';

        // Header section with title and global controls
        const header = document.createElement('div');
        header.className = 'output-header';
        
        const headingContainer = document.createElement('div');
        headingContainer.className = 'heading-container';
        
        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'collapse-icon';
        collapseIcon.textContent = this._isCollapsed ? '▶' : '▼';
        collapseIcon.addEventListener('click', () => this.toggleCollapse());
        
        const heading = document.createElement('h2');
        heading.textContent = 'Output';
        heading.className = 'output-heading';
        heading.addEventListener('click', () => this.toggleCollapse());
        
        headingContainer.appendChild(collapseIcon);
        headingContainer.appendChild(heading);

        // Add global control buttons
        const globalControls = document.createElement('div');
        globalControls.className = 'global-controls';
        
        const globalToggleButton = document.createElement('button');
        globalToggleButton.textContent = this.areAllConnected() ? 'Disconnect All' : 'Connect All';
        globalToggleButton.className = 'global-toggle-btn';
        globalToggleButton.addEventListener('click', () => this.toggleAllConnections());
        
        globalControls.appendChild(globalToggleButton);
        
        header.appendChild(headingContainer);
        header.appendChild(globalControls);

        // Main container for collapsible content
        this.mainContainer = document.createElement('div');
        this.mainContainer.className = `main-container${this._isCollapsed ? ' collapsed' : ''}`;
        
        // Add button container
        const addButtonContainer = document.createElement('div');
        addButtonContainer.className = 'add-button-container';
        
        const addButton = document.createElement('button');
        addButton.textContent = '+ Add Output';
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
            globalToggleButton.textContent = this.areAllConnected() ? 'Disconnect All' : 'Connect All';
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

    private createTabElement(config: OutputConfig): HTMLElement {
        const tab = document.createElement('div');
        tab.className = `tab${config.id === this._activeConfigId ? ' active' : ''}`;
        
        tab.innerHTML = `
            <span class="tab-name ${config.isConnected ? 'connected' : ''}">${config.name}</span>
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

    private startTabRename(config: OutputConfig) {
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

        // Connect button and controls
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'form-group button-group';
        buttonGroup.innerHTML = `
            <button class="toggle-connect-btn">${config.isConnected ? 'Disconnect' : 'Connect'}</button>
            <button class="download-log-btn">Download Log</button>
        `;

        // Messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        
        config.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.textContent = message;
            messagesContainer.appendChild(messageDiv);
        });

        // Append all sections
        this.contentContainer.appendChild(topicBrokerRow);
        this.contentContainer.appendChild(buttonGroup);
        this.contentContainer.appendChild(messagesContainer);

        // Add event listeners
        this.addContentEventListeners(config);
    }

    private addContentEventListeners(config: OutputConfig) {
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

        // Connect/Disconnect button
        const toggleButton = this.contentContainer.querySelector('.toggle-connect-btn');
        toggleButton?.addEventListener('click', () => {
            config.isConnected = !config.isConnected;
            this.notifyStateChange();
            this.render();
        });

        // Download log button
        const downloadButton = this.contentContainer.querySelector('.download-log-btn');
        downloadButton?.addEventListener('click', () => {
            this.downloadLog(config);
        });
    }

    private downloadLog(config: OutputConfig) {
        // Create log content
        const logContent = config.messages.join('\n');
        
        // Create a blob with the log content
        const blob = new Blob([logContent], { type: 'text/plain' });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.name.replace(/\s+/g, '_')}_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        
        // Append the anchor to the body, click it, and remove it
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        // Notify the extension that a log was downloaded
        this._vscode?.postMessage({
            type: 'logDownloaded',
            data: {
                configId: config.id,
                configName: config.name,
                messageCount: config.messages.length,
                timestamp: new Date().toISOString()
            }
        });
    }

    private addConfig() {
        const newConfig: OutputConfig = {
            id: crypto.randomUUID(),
            name: `Output ${this._configs.length + 1}`,
            topic: '',
            broker: '',
            isConnected: false,
            messages: []
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
            type: 'outputStateChanged',
            data: {
                configs: this._configs,
                activeConfigId: this._activeConfigId,
                isCollapsed: this._isCollapsed
            }
        });
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

            .output-wrapper {
                background: var(--vscode-editor-background);
                border-radius: 4px;
                padding: 12px;
                border: 1px solid var(--vscode-panel-border);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                margin-bottom: 16px;
            }

            .output-header {
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

            .output-heading {
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

            input[type="text"] {
                width: 100%;
                padding: 4px 8px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                box-sizing: border-box;
            }

            .toggle-connect-btn {
                padding: 6px 12px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: 1px solid var(--vscode-button-border);
                border-radius: 2px;
                cursor: pointer;
                font-weight: 500;
                font-size: var(--vscode-font-size);
            }

            .toggle-connect-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }

            .messages {
                height: 300px;
                overflow-y: auto;
                padding: 12px;
                background: rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.5);
                border: 1px solid var(--vscode-input-border);
                border-radius: 3px;
                font-family: var(--vscode-editor-font-family);
                margin-bottom: 16px;
                font-size: 0.9em;
                line-height: 1.6;
            }

            .message {
                padding: 8px 12px;
                border-bottom: 1px solid var(--vscode-panel-border);
                white-space: pre-wrap;
                word-break: break-all;
            }

            .message:last-child {
                border-bottom: none;
            }

            .tab-name.connected {
                color: var(--vscode-testing-runAction, #4CAF50);
                font-weight: 600;
            }

            .button-group {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .download-log-btn {
                padding: 6px 12px;
                background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
                color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
                border: 1px solid var(--vscode-button-border);
                border-radius: 2px;
                cursor: pointer;
                font-weight: 500;
                font-size: var(--vscode-font-size);
            }

            .download-log-btn:hover {
                background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
            }
        `;
    }

    private areAllConnected(): boolean {
        return this._configs.length > 0 && this._configs.every(config => config.isConnected);
    }

    private toggleAllConnections() {
        const newState = !this.areAllConnected();
        this._configs.forEach(config => {
            config.isConnected = newState;
        });
        this.notifyStateChange();
        this.render();
    }
}

customElements.define('output-component', OutputComponent); 