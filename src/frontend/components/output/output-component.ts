/// <reference lib="dom" />

export class OutputComponent extends HTMLElement {
    private _vscode: any;
    private _topic: string = '';
    private _broker: string = '';
    private _isConnected: boolean = false;
    private _messages: string[] = [];

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
            this._isConnected = state.isConnected || false;
            this._messages = state.messages || [];
            this.render();
        }
    }

    public addMessage(message: string): void {
        this._messages.push(message);
        this.render();
        // Scroll to bottom after adding new message
        if (this.shadowRoot) {
            const messages = this.shadowRoot.querySelector('.messages');
            if (messages) {
                messages.scrollTop = messages.scrollHeight;
            }
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

            input[type="text"] {
                width: 100%;
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: var(--border-radius);
                font-family: var(--vscode-font-family);
                box-sizing: border-box;
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

            .messages {
                height: 300px;
                overflow-y: auto;
                padding: 16px;
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: var(--border-radius);
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
        `;

        const html = `
            <style>${styles}</style>
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
                <button class="toggle-connect-btn">${this._isConnected ? 'Disconnect' : 'Connect'}</button>
            </div>
            <div class="messages">
                ${this._messages.map(message => `
                    <div class="message">${message}</div>
                `).join('')}
            </div>
        `;

        this.shadowRoot.innerHTML = html;
        this.addEventListeners();
    }

    private addEventListeners() {
        const topicInput = this.shadowRoot?.querySelector('.topic-input');
        const brokerInput = this.shadowRoot?.querySelector('.broker-input');
        const connectButton = this.shadowRoot?.querySelector('.toggle-connect-btn');

        topicInput?.addEventListener('input', (e) => {
            this._topic = (e.target as HTMLInputElement).value;
            this.notifyStateChange();
        });

        brokerInput?.addEventListener('input', (e) => {
            this._broker = (e.target as HTMLInputElement).value;
            this.notifyStateChange();
        });

        connectButton?.addEventListener('click', () => {
            this._isConnected = !this._isConnected;
            this.notifyStateChange();
            this.render();
        });
    }

    private notifyStateChange() {
        this._vscode?.postMessage({
            type: 'outputStateChanged',
            data: {
                topic: this._topic,
                broker: this._broker,
                isConnected: this._isConnected
            }
        });
    }
}

customElements.define('output-component', OutputComponent); 