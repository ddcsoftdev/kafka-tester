/// <reference lib="dom" />

export class HeaderComponent extends HTMLElement {
    private _vscode: any;
    private _isLocalBrokerRunning: boolean = false;

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

    public setLocalBrokerStatus(isRunning: boolean): void {
        this._isLocalBrokerRunning = isRunning;
        this.render();
    }

    private render() {
        if (!this.shadowRoot) return;

        const styles = `
            :host {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }

            .top-actions {
                display: flex;
                gap: 12px;
                margin-bottom: 24px;
            }

            .action-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .action-button:hover {
                background: var(--vscode-button-hoverBackground);
                transform: translateY(-1px);
            }

            .action-button svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }

            .section {
                margin-bottom: 24px;
                padding: 20px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
                background: color-mix(in srgb, var(--vscode-editor-background) 97%, white);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: all var(--transition-speed) ease;
            }

            .section:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateY(-1px);
            }

            .checkbox-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            input[type="checkbox"] {
                appearance: none;
                width: 16px;
                height: 16px;
                border: 1px solid var(--vscode-checkbox-border);
                border-radius: 3px;
                background: var(--vscode-checkbox-background);
                position: relative;
                cursor: pointer;
                transition: all var(--transition-speed) ease;
            }

            input[type="checkbox"]:checked {
                background: var(--vscode-checkbox-selectBackground);
                border-color: var(--vscode-checkbox-selectBorder);
            }

            input[type="checkbox"]:checked::after {
                content: "✓";
                position: absolute;
                color: var(--vscode-checkbox-foreground);
                font-size: 12px;
                left: 2px;
                top: -1px;
            }

            input[type="checkbox"]:hover {
                border-color: var(--vscode-checkbox-selectBorder);
            }

            #importInput {
                display: none;
            }
        `;

        const html = `
            <style>${styles}</style>
            <div class="top-actions">
                <button class="action-button" id="exportBtn">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 3l7 7h-4v8h-6v-8h-4l7-7zm0-2l-9 9h6v8h6v-8h6l-9-9zm9 20h-18v2h18v-2z"/>
                    </svg>
                    Export Configuration
                </button>
                <button class="action-button" id="importBtn">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 21l-7-7h4v-8h6v8h4l-7 7zm0 2l9-9h-6v-8h-6v8h-6l9 9zm-9-20h18v2h-18v-2z"/>
                    </svg>
                    Import Configuration
                </button>
                <input type="file" id="importInput" accept=".json">
            </div>

            <div class="section">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="useLocalBroker" ${this._isLocalBrokerRunning ? 'checked' : ''}>
                    <label for="useLocalBroker">Use Local Broker</label>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = html;
        this.addEventListeners();
    }

    private addEventListeners() {
        const exportBtn = this.shadowRoot?.querySelector('#exportBtn');
        const importBtn = this.shadowRoot?.querySelector('#importBtn');
        const importInput = this.shadowRoot?.querySelector('#importInput') as HTMLInputElement;
        const useLocalBroker = this.shadowRoot?.querySelector('#useLocalBroker');

        exportBtn?.addEventListener('click', () => {
            this._vscode?.postMessage({
                type: 'exportConfiguration'
            });
        });

        importBtn?.addEventListener('click', () => {
            importInput?.click();
        });

        importInput?.addEventListener('change', (e) => {
            const input = e.target as HTMLInputElement;
            const file = input.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const config = JSON.parse(event.target?.result as string);
                        this._vscode?.postMessage({
                            type: 'importConfiguration',
                            data: config
                        });
                    } catch (error) {
                        this._vscode?.postMessage({
                            type: 'error',
                            message: 'Failed to parse configuration file'
                        });
                    }
                };
                reader.readAsText(file);
            }
        });

        useLocalBroker?.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            this._vscode?.postMessage({
                type: 'toggleLocalBroker',
                data: { enabled: isChecked }
            });
        });
    }
}

customElements.define('header-component', HeaderComponent); 