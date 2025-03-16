/// <reference lib="dom" />

export class InputComponent extends HTMLElement {
    private _vscode: any;
    private _isRunning: boolean = false;
    private _sleep: number = 0;
    private _stopAfter: { enabled: boolean; count: number } = { enabled: false, count: 100 };
    private _topic: string = '';
    private _broker: string = '';
    private _template: string = '';
    private _parameters: any[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    set vscode(value: any) {
        this._vscode = value;
    }

    public loadState(state: any): void {
        if (state) {
            this._topic = state.topic || '';
            this._broker = state.broker || '';
            this._template = state.template || '';
            this._parameters = state.parameters || [];
            this._sleep = state.sleep || 0;
            this._stopAfter = state.stopAfter || { enabled: false, count: 100 };
            this.render();
        }
    }

    private render() {
        if (!this.shadowRoot) return;

        const styles = `
            :host {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }

            .stream-controls {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
                padding: 16px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
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

            .row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 24px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-label {
                display: block;
                margin-bottom: 8px;
                color: var(--vscode-foreground);
                font-weight: 500;
            }

            input[type="text"],
            input[type="number"],
            textarea {
                width: 100%;
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: var(--border-radius);
                font-family: var(--vscode-font-family);
                box-sizing: border-box;
            }

            textarea {
                min-height: 80px;
                resize: vertical;
            }

            .param-section {
                margin-top: 32px;
                padding: 24px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
                background: var(--vscode-editor-background);
            }

            .section-title {
                font-size: 1.2em;
                font-weight: 600;
                margin-bottom: 20px;
                color: var(--vscode-editor-foreground);
            }

            .param-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
                margin-bottom: 12px;
            }

            .checkbox-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px;
            }

            button {
                padding: 8px 16px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            button:hover {
                background: var(--vscode-button-hoverBackground);
            }

            .param-tab-add {
                padding: 8px 16px;
                background: transparent;
                border: 2px dashed var(--vscode-tab-border);
                color: var(--vscode-button-foreground);
                font-size: 1.2em;
                height: 32px;
                min-width: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                border-radius: var(--border-radius);
                cursor: pointer;
            }

            .param-tab-add:hover {
                background: color-mix(in srgb, var(--vscode-button-background) 15%, transparent);
                border-color: var(--vscode-focusBorder);
                transform: scale(1.05);
            }
        `;

        const html = `
            <style>${styles}</style>
            <div class="stream-controls">
                <div class="sleep-container">
                    <label>Sleep (ms):</label>
                    <input type="number" class="sleep-input" min="0" value="${this._sleep}">
                </div>
                <div class="stop-after-container">
                    <div class="checkbox-wrapper">
                        <input type="checkbox" class="stop-after-checkbox" ${this._stopAfter.enabled ? 'checked' : ''}>
                        <label>Stop after</label>
                    </div>
                    <input type="number" class="stop-after-input" min="1" value="${this._stopAfter.count}" ${!this._stopAfter.enabled ? 'disabled' : ''}>
                    <label>events</label>
                </div>
            </div>

            <div class="row">
                <div class="form-group">
                    <label class="form-label">Topic</label>
                    <input type="text" class="topic-input" placeholder="Enter topic name" value="${this._topic}">
                </div>
                <div class="form-group">
                    <label class="form-label">Broker Address</label>
                    <input type="text" class="broker-input" placeholder="localhost:9092" value="${this._broker}">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">JSON Template</label>
                <textarea class="template-input" placeholder='{"key": "{{paramName}}"}' spellcheck="false">${this._template}</textarea>
            </div>

            <div class="param-section">
                <div class="section-title">Parameters</div>
                <div class="param-content">
                    <div class="param-tabs">
                        <button class="param-tab-add">+</button>
                    </div>
                    <div class="param-panels">
                        ${this._parameters.map(param => this.renderParameter(param)).join('')}
                    </div>
                </div>
            </div>

            <div class="form-group">
                <button class="toggle-pause-btn">${this._isRunning ? 'Stop' : 'Start'}</button>
            </div>
        `;

        this.shadowRoot.innerHTML = html;
        this.addEventListeners();
    }

    private renderParameter(param: any) {
        return `
            <div class="param-row" data-param-id="${param.id}">
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="param-randomize" ${param.isRandomized ? 'checked' : ''}>
                    <label>Rand</label>
                </div>
                <input type="text" class="param-name-input" placeholder="Parameter name" value="${param.name || ''}">
                <div class="param-type-container ${!param.isRandomized ? 'hidden' : ''}">
                    <input type="text" class="param-type-select" readonly placeholder="Select faker type" value="${param.type || ''}">
                </div>
                <div class="param-values ${param.isRandomized ? 'hidden' : ''}">
                    <input type="text" class="param-value-input" placeholder="{value1}{value2}..." value="${param.values?.join('') || ''}">
                </div>
            </div>
        `;
    }

    private addEventListeners() {
        // Stream controls
        const sleepInput = this.shadowRoot?.querySelector('.sleep-input');
        const stopAfterCheckbox = this.shadowRoot?.querySelector('.stop-after-checkbox');
        const stopAfterInput = this.shadowRoot?.querySelector('.stop-after-input');

        sleepInput?.addEventListener('change', (e) => {
            this._sleep = parseInt((e.target as HTMLInputElement).value) || 0;
            this.notifyStateChange();
        });

        stopAfterCheckbox?.addEventListener('change', (e) => {
            this._stopAfter.enabled = (e.target as HTMLInputElement).checked;
            if (stopAfterInput) {
                (stopAfterInput as HTMLInputElement).disabled = !this._stopAfter.enabled;
            }
            this.notifyStateChange();
        });

        stopAfterInput?.addEventListener('change', (e) => {
            this._stopAfter.count = parseInt((e.target as HTMLInputElement).value) || 100;
            this.notifyStateChange();
        });

        // Topic and broker inputs
        const topicInput = this.shadowRoot?.querySelector('.topic-input');
        const brokerInput = this.shadowRoot?.querySelector('.broker-input');
        const templateInput = this.shadowRoot?.querySelector('.template-input');

        topicInput?.addEventListener('input', (e) => {
            this._topic = (e.target as HTMLInputElement).value;
            this.notifyStateChange();
        });

        brokerInput?.addEventListener('input', (e) => {
            this._broker = (e.target as HTMLInputElement).value;
            this.notifyStateChange();
        });

        templateInput?.addEventListener('input', (e) => {
            this._template = (e.target as HTMLTextAreaElement).value;
            this.notifyStateChange();
        });

        // Parameter controls
        const addParamButton = this.shadowRoot?.querySelector('.param-tab-add');
        addParamButton?.addEventListener('click', () => {
            this.addParameter();
        });

        // Start/Stop button
        const toggleButton = this.shadowRoot?.querySelector('.toggle-pause-btn');
        toggleButton?.addEventListener('click', () => {
            this._isRunning = !this._isRunning;
            this.notifyStateChange();
            this.render();
        });

        // Parameter event listeners
        this.shadowRoot?.querySelectorAll('.param-row').forEach(row => {
            const paramId = row.getAttribute('data-param-id');
            if (!paramId) return;

            const randomizeCheckbox = row.querySelector('.param-randomize');
            const nameInput = row.querySelector('.param-name-input');
            const typeSelect = row.querySelector('.param-type-select');
            const valueInput = row.querySelector('.param-value-input');
            const typeContainer = row.querySelector('.param-type-container');
            const valuesContainer = row.querySelector('.param-values');

            randomizeCheckbox?.addEventListener('change', (e) => {
                const isRandomized = (e.target as HTMLInputElement).checked;
                if (typeContainer && valuesContainer) {
                    typeContainer.classList.toggle('hidden', !isRandomized);
                    valuesContainer.classList.toggle('hidden', isRandomized);
                }
                this.updateParameter(paramId, { isRandomized });
            });

            nameInput?.addEventListener('input', (e) => {
                this.updateParameter(paramId, { name: (e.target as HTMLInputElement).value });
            });

            typeSelect?.addEventListener('click', () => {
                // Show faker type selection dialog
                this.showFakerTypeDialog(paramId);
            });

            valueInput?.addEventListener('input', (e) => {
                this.updateParameter(paramId, { values: [(e.target as HTMLInputElement).value] });
            });
        });
    }

    private addParameter() {
        const param = {
            id: `param-${Date.now()}`,
            name: `Parameter ${this._parameters.length + 1}`,
            isRandomized: false,
            type: '',
            values: []
        };
        this._parameters.push(param);
        this.notifyStateChange();
        this.render();
    }

    private updateParameter(paramId: string, updates: any) {
        const param = this._parameters.find(p => p.id === paramId);
        if (param) {
            Object.assign(param, updates);
            this.notifyStateChange();
        }
    }

    private showFakerTypeDialog(paramId: string) {
        // Implement faker type selection dialog
        // This should be implemented based on your faker type requirements
    }

    private notifyStateChange() {
        this._vscode?.postMessage({
            type: 'stateChanged',
            data: {
                topic: this._topic,
                broker: this._broker,
                template: this._template,
                parameters: this._parameters,
                sleep: this._sleep,
                stopAfter: this._stopAfter,
                isRunning: this._isRunning
            }
        });
    }
}

customElements.define('input-component', InputComponent); 