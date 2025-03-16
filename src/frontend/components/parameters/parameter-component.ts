interface Parameter {
    id: string;
    name: string;
    type: string;
    value: any;
    description?: string;
    defaultValue?: any;
    required?: boolean;
}

export class ParameterComponent extends HTMLElement {
    private _parameters: Parameter[] = [];
    private _activeTabId: string | null = null;
    private _vscode: any;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    set parameters(value: Parameter[]) {
        this._parameters = value;
        this.render();
    }

    get parameters(): Parameter[] {
        return this._parameters;
    }

    addParameter(parameter: Parameter) {
        this._parameters.push(parameter);
        this._activeTabId = parameter.id;
        this.render();
    }

    updateParameter(id: string, updates: Partial<Parameter>) {
        const parameter = this._parameters.find(p => p.id === id);
        if (parameter) {
            Object.assign(parameter, updates);
            this.render();
        }
    }

    removeParameter(id: string) {
        this._parameters = this._parameters.filter(p => p.id !== id);
        if (this._activeTabId === id) {
            this._activeTabId = this._parameters.length > 0 ? this._parameters[0].id : null;
        }
        this.render();
    }

    private render() {
        if (!this.shadowRoot) return;

        const styles = `
            :host {
                display: block;
                height: 100%;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                font-family: var(--vscode-font-family);
            }

            .parameter-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                border-radius: var(--border-radius, 4px);
                overflow: hidden;
            }

            .tabs {
                display: flex;
                padding: 8px 8px 0;
                background-color: var(--vscode-tab-inactiveBackground);
                border-bottom: 1px solid var(--vscode-tab-border);
                overflow-x: auto;
                scrollbar-width: thin;
            }

            .tab {
                padding: 8px 16px;
                cursor: pointer;
                border: 1px solid var(--vscode-tab-border);
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                margin-right: 4px;
                background-color: var(--vscode-tab-inactiveBackground);
                color: var(--vscode-tab-inactiveForeground);
                opacity: 0.8;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 100px;
                justify-content: space-between;
            }

            .tab.active {
                opacity: 1;
                background-color: var(--vscode-tab-activeBackground);
                color: var(--vscode-tab-activeForeground);
                border-color: var(--vscode-focusBorder);
                position: relative;
            }

            .tab.active::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                right: 0;
                height: 1px;
                background-color: var(--vscode-tab-activeBackground);
            }

            .tab:hover:not(.active) {
                opacity: 0.9;
                background-color: var(--vscode-tab-hoverBackground, rgba(255,255,255,0.1));
            }

            .close-button {
                width: 16px;
                height: 16px;
                border: none;
                background: none;
                color: inherit;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                font-size: 16px;
                border-radius: 50%;
            }

            .close-button:hover {
                opacity: 1;
                background-color: rgba(255, 255, 255, 0.1);
            }

            .add-tab {
                padding: 8px;
                background: none;
                border: none;
                color: var(--vscode-button-foreground);
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border-radius: 4px;
            }

            .add-tab:hover {
                opacity: 1;
                background-color: var(--vscode-button-hoverBackground);
            }

            .content {
                flex: 1;
                padding: 16px;
                overflow: auto;
                background-color: var(--vscode-editor-background);
            }

            .parameter-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .form-row {
                display: flex;
                gap: 16px;
            }

            .form-row .form-group {
                flex: 1;
            }

            label {
                color: var(--vscode-foreground);
                font-size: 0.9em;
            }

            input, select, textarea {
                padding: 8px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                font-family: var(--vscode-font-family);
            }

            input:focus, select:focus, textarea:focus {
                outline: 1px solid var(--vscode-focusBorder);
                border-color: var(--vscode-focusBorder);
            }

            textarea {
                min-height: 80px;
                resize: vertical;
            }

            .checkbox-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .checkbox-group input {
                width: auto;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                gap: 16px;
                color: var(--vscode-descriptionForeground);
                padding: 40px;
                text-align: center;
            }

            .empty-state-icon {
                font-size: 48px;
                opacity: 0.5;
            }

            .empty-state-title {
                font-size: 1.2em;
                margin-bottom: 8px;
            }

            .empty-state-description {
                font-size: 0.9em;
                opacity: 0.8;
            }

            .button {
                padding: 8px 16px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: 1px solid var(--vscode-button-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="parameter-container">
                <div class="tabs">
                    ${this._parameters.map(param => `
                        <div class="tab ${param.id === this._activeTabId ? 'active' : ''}" data-param-id="${param.id}">
                            <span>${param.name || 'Unnamed Parameter'}</span>
                            <button class="close-button" data-param-id="${param.id}" title="Remove parameter">×</button>
                        </div>
                    `).join('')}
                    <button class="add-tab" title="Add new parameter">+</button>
                </div>
                <div class="content">
                    ${this._parameters.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">⚙️</div>
                            <div class="empty-state-title">No parameters configured</div>
                            <div class="empty-state-description">Add parameters to configure your Kafka stream</div>
                            <button class="button add-parameter-button">Add Parameter</button>
                        </div>
                    ` : this._activeTabId ? `
                        <div class="parameter-form">
                            ${this.renderParameterForm(this._parameters.find(p => p.id === this._activeTabId)!)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add event listeners
        this.addEventListeners();
    }

    private renderParameterForm(parameter: Parameter) {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" value="${parameter.name || ''}" placeholder="Parameter name">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type">
                        <option value="string" ${parameter.type === 'string' ? 'selected' : ''}>String</option>
                        <option value="number" ${parameter.type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="boolean" ${parameter.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                        <option value="json" ${parameter.type === 'json' ? 'selected' : ''}>JSON</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" placeholder="Parameter description">${parameter.description || ''}</textarea>
            </div>

            <div class="form-group">
                <label for="value">Value</label>
                ${this.renderValueInput(parameter)}
            </div>

            <div class="form-group">
                <label for="defaultValue">Default Value</label>
                <input type="text" id="defaultValue" value="${parameter.defaultValue || ''}" placeholder="Default value">
            </div>

            <div class="form-group checkbox-group">
                <input type="checkbox" id="required" ${parameter.required ? 'checked' : ''}>
                <label for="required">Required</label>
            </div>
        `;
    }

    private renderValueInput(parameter: Parameter) {
        switch (parameter.type) {
            case 'boolean':
                return `
                    <select id="value">
                        <option value="true" ${parameter.value === true ? 'selected' : ''}>True</option>
                        <option value="false" ${parameter.value === false ? 'selected' : ''}>False</option>
                    </select>
                `;
            case 'number':
                return `
                    <input type="number" id="value" value="${parameter.value || ''}" placeholder="Parameter value">
                `;
            case 'json':
                return `
                    <textarea id="value" placeholder="JSON value">${
                        typeof parameter.value === 'object' 
                            ? JSON.stringify(parameter.value, null, 2) 
                            : parameter.value || ''
                    }</textarea>
                `;
            default:
                return `
                    <input type="text" id="value" value="${parameter.value || ''}" placeholder="Parameter value">
                `;
        }
    }

    private addEventListeners() {
        // Tab click events
        this.shadowRoot?.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const paramId = (e.currentTarget as HTMLElement).dataset.paramId;
                if (paramId) {
                    this._activeTabId = paramId;
                    this.render();
                }
            });
        });

        // Close button events
        this.shadowRoot?.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const paramId = (e.currentTarget as HTMLElement).dataset.paramId;
                if (paramId) {
                    this.removeParameter(paramId);
                }
            });
        });

        // Add tab button event
        const addButtons = [
            this.shadowRoot?.querySelector('.add-tab'),
            this.shadowRoot?.querySelector('.add-parameter-button')
        ];
        
        addButtons.forEach(button => {
            button?.addEventListener('click', () => {
                const newParam: Parameter = {
                    id: `param-${Date.now()}`,
                    name: 'New Parameter',
                    type: 'string',
                    value: '',
                    required: false
                };
                this.addParameter(newParam);
            });
        });

        // Form input events
        this.shadowRoot?.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                let value: any = target.value;

                // Handle special cases
                if (target.id === 'type') {
                    // Reset value when type changes
                    this.updateParameter(this._activeTabId!, { 
                        type: value as any,
                        value: this.getDefaultValueForType(value)
                    });
                    return;
                } else if (target.id === 'value' && this._parameters.find(p => p.id === this._activeTabId)?.type === 'json') {
                    try {
                        value = JSON.parse(value);
                    } catch (error) {
                        // Invalid JSON, keep as string
                    }
                } else if (target.id === 'value' && this._parameters.find(p => p.id === this._activeTabId)?.type === 'number') {
                    value = parseFloat(value);
                } else if (target.id === 'value' && this._parameters.find(p => p.id === this._activeTabId)?.type === 'boolean') {
                    value = value === 'true';
                } else if (target.type === 'checkbox') {
                    value = (target as HTMLInputElement).checked;
                }

                this.updateParameter(this._activeTabId!, { [target.id]: value });
            });
        });
    }

    private getDefaultValueForType(type: string): any {
        switch (type) {
            case 'string':
                return '';
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'json':
                return {};
            default:
                return '';
        }
    }
}

customElements.define('parameter-manager', ParameterComponent); 