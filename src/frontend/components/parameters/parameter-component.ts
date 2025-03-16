/**
 * Parameter Component
 * 
 * A web component for managing parameters with support for random values and faker types.
 */

// Types
interface Parameter {
  id: string;
  name: string;
  isRandom: boolean;
  values: string;
  fakerType: string;
}

// Constants
const FAKER_TYPES = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'company', label: 'Company' }
];

class ParameterComponent extends HTMLElement {
  // Private properties
  private parameters: Parameter[] = [];
  private tabContainer: HTMLDivElement = document.createElement('div');
  private contentContainer: HTMLDivElement = document.createElement('div');
  private activeParameterId: string | null = null;
  private onParametersChange?: (parameters: Parameter[]) => void;
  
  // VSCode theme variables
  private _vscode = {
    background: 'var(--vscode-editor-background)',
    foreground: 'var(--vscode-foreground)',
    font: 'var(--vscode-font-family)',
    fontSize: 'var(--vscode-font-size)',
    border: 'var(--vscode-widget-border)',
    inputBg: 'var(--vscode-input-background)',
    inputFg: 'var(--vscode-input-foreground)',
    inputBorder: 'var(--vscode-input-border)',
    buttonBg: 'var(--vscode-button-background)',
    buttonFg: 'var(--vscode-button-foreground)',
    buttonBorder: 'var(--vscode-button-border)',
    buttonHoverBg: 'var(--vscode-button-hoverBackground)',
    listHoverBg: 'var(--vscode-list-hoverBackground)',
    listActiveBg: 'var(--vscode-list-activeSelectionBackground)',
    listActiveFg: 'var(--vscode-list-activeSelectionForeground)',
    focusBorder: 'var(--vscode-focusBorder)',
    iconFg: 'var(--vscode-icon-foreground)',
    toolbarHoverBg: 'var(--vscode-toolbar-hoverBackground)',
  };

  // Lifecycle methods
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.init();
  }

  connectedCallback() {
    this.render();
  }

  // Public API
  /**
   * Set a callback function to be called when parameters change
   */
  set parametersCallback(callback: (parameters: Parameter[]) => void) {
    this.onParametersChange = callback;
  }

  /**
   * Get the current parameters
   */
  getParameters(): Parameter[] {
    return [...this.parameters];
  }

  /**
   * Set parameters from outside
   */
  setParameters(parameters: Parameter[]) {
    this.parameters = [...parameters];
    this.render();
  }

  // Private methods
  private init() {
    this.setupBaseStructure();
    this.setupStyles();
  }

  private render() {
    this.renderTabs();
    if (this.activeParameterId) {
      this.renderParameterContent(this.activeParameterId);
    } else if (this.parameters.length > 0) {
      this.activeParameterId = this.parameters[0].id;
      this.renderParameterContent(this.activeParameterId);
    } else {
      this.contentContainer.innerHTML = '';
    }
  }

  private notifyParametersChange() {
    if (this.onParametersChange) {
      this.onParametersChange([...this.parameters]);
    }
  }

  private setupBaseStructure() {
    const wrapper = document.createElement('div');
    wrapper.className = 'parameter-wrapper';

    // Header section with title and add button
    const header = document.createElement('div');
    header.className = 'parameters-header';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Parameters';
    heading.className = 'parameters-heading';

    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Parameter';
    addButton.className = 'add-parameter-btn';
    addButton.addEventListener('click', () => this.addParameter());

    header.appendChild(heading);
    header.appendChild(addButton);

    // Tab container
    this.tabContainer = document.createElement('div');
    this.tabContainer.className = 'tab-container';
    
    // Content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'content-container';

    wrapper.appendChild(header);
    wrapper.appendChild(this.tabContainer);
    wrapper.appendChild(this.contentContainer);

    this.shadowRoot!.appendChild(wrapper);
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot!.appendChild(style);
  }

  private getStyles(): string {
    return `
      :host {
        display: block;
        font-family: ${this._vscode.font};
        color: ${this._vscode.foreground};
      }

      .parameter-wrapper {
        background: ${this._vscode.background};
        border-radius: 4px;
        padding: 12px;
      }

      .parameters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .parameters-heading {
        margin: 0;
        font-size: ${this._vscode.fontSize};
        font-weight: 600;
        color: ${this._vscode.foreground};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .add-parameter-btn {
        padding: 3px 8px;
        border: 1px solid ${this._vscode.buttonBorder};
        border-radius: 2px;
        background: ${this._vscode.buttonBg};
        color: ${this._vscode.buttonFg};
        font-size: ${this._vscode.fontSize};
        cursor: pointer;
      }

      .add-parameter-btn:hover {
        background: ${this._vscode.buttonHoverBg};
      }

      .tab-container {
        display: flex;
        gap: 4px;
        margin-bottom: 12px;
        flex-wrap: wrap;
        border-bottom: 1px solid ${this._vscode.border};
        padding-bottom: 8px;
      }

      .tab {
        padding: 4px 8px;
        border: 1px solid ${this._vscode.border};
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        background: ${this._vscode.background};
        font-size: ${this._vscode.fontSize};
        transition: all 0.1s ease;
      }

      .tab:hover {
        background: ${this._vscode.listHoverBg};
      }

      .tab.active {
        background: ${this._vscode.listActiveBg};
        color: ${this._vscode.listActiveFg};
      }

      .tab-close {
        border: none;
        background: none;
        cursor: pointer;
        padding: 1px 4px;
        border-radius: 2px;
        color: ${this._vscode.iconFg};
        font-size: 12px;
        line-height: 1;
      }

      .tab-close:hover {
        background: ${this._vscode.toolbarHoverBg};
      }

      .parameter-form {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        background: ${this._vscode.background};
        border: 1px solid ${this._vscode.border};
        border-radius: 3px;
      }

      .form-row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .form-row label {
        font-size: ${this._vscode.fontSize};
        color: ${this._vscode.foreground};
        white-space: nowrap;
      }

      input[type="text"] {
        flex: 1;
        min-width: 0;
        padding: 3px 6px;
        border: 1px solid ${this._vscode.inputBorder};
        border-radius: 2px;
        font-size: ${this._vscode.fontSize};
        background: ${this._vscode.inputBg};
        color: ${this._vscode.inputFg};
      }

      input[type="text"]:focus {
        outline: none;
        border-color: ${this._vscode.focusBorder};
      }

      input[type="checkbox"] {
        width: 14px;
        height: 14px;
        border: 1px solid ${this._vscode.border};
        border-radius: 2px;
        cursor: pointer;
        background: ${this._vscode.inputBg};
      }

      select {
        padding: 3px 6px;
        border: 1px solid ${this._vscode.inputBorder};
        border-radius: 2px;
        background: ${this._vscode.inputBg};
        color: ${this._vscode.inputFg};
        font-size: ${this._vscode.fontSize};
        min-width: 140px;
        cursor: pointer;
      }

      select:focus {
        outline: none;
        border-color: ${this._vscode.focusBorder};
      }

      .values-input {
        flex: 1;
        min-width: 180px;
      }

      .faker-select {
        min-width: 140px;
      }
    `;
  }

  private addParameter() {
    const param: Parameter = {
      id: crypto.randomUUID(),
      name: `Parameter ${this.parameters.length + 1}`,
      isRandom: false,
      values: '',
      fakerType: 'name'
    };
    
    this.parameters.push(param);
    this.activeParameterId = param.id;
    this.render();
    this.notifyParametersChange();
  }

  private renderTabs() {
    this.tabContainer.innerHTML = '';
    
    this.parameters.forEach(param => {
      const tab = this.createTabElement(param);
      this.tabContainer.appendChild(tab);
    });
  }

  private createTabElement(param: Parameter): HTMLElement {
    const tab = document.createElement('div');
    tab.className = `tab${param.id === this.activeParameterId ? ' active' : ''}`;
    tab.innerHTML = `
      <span>${param.name}</span>
      <button class="tab-close">×</button>
    `;

    tab.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).matches('.tab-close')) {
        this.activeParameterId = param.id;
        this.render();
      }
    });

    tab.querySelector('.tab-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeParameter(param.id);
    });

    return tab;
  }

  private renderParameterContent(paramId: string) {
    const param = this.parameters.find(p => p.id === paramId);
    if (!param) return;

    this.contentContainer.innerHTML = '';
    const form = document.createElement('div');
    form.className = 'parameter-form';

    // Add form rows
    form.appendChild(this.createNameInput(param));
    form.appendChild(this.createRandomCheckbox(param));
    
    // Conditional inputs based on random checkbox
    if (param.isRandom) {
      form.appendChild(this.createFakerTypeSelect(param));
    } else {
      form.appendChild(this.createValuesInput(param));
    }

    this.contentContainer.appendChild(form);
  }

  private createNameInput(param: Parameter): HTMLElement {
    const nameRow = document.createElement('div');
    nameRow.className = 'form-row';
    nameRow.innerHTML = `
      <label>Name:</label>
      <input type="text" value="${param.name}" style="width: 120px;" />
    `;
    
    nameRow.querySelector('input')?.addEventListener('input', (e) => {
      param.name = (e.target as HTMLInputElement).value;
      this.render();
      this.notifyParametersChange();
    });
    
    return nameRow;
  }

  private createRandomCheckbox(param: Parameter): HTMLElement {
    const randomRow = document.createElement('div');
    randomRow.className = 'form-row';
    randomRow.innerHTML = `
      <label>Random:</label>
      <input type="checkbox" ${param.isRandom ? 'checked' : ''} />
    `;
    
    randomRow.querySelector('input')?.addEventListener('change', (e) => {
      param.isRandom = (e.target as HTMLInputElement).checked;
      this.render();
      this.notifyParametersChange();
    });
    
    return randomRow;
  }

  private createFakerTypeSelect(param: Parameter): HTMLElement {
    const fakerRow = document.createElement('div');
    fakerRow.className = 'form-row';
    
    let optionsHtml = '';
    FAKER_TYPES.forEach(type => {
      optionsHtml += `<option value="${type.value}" ${param.fakerType === type.value ? 'selected' : ''}>${type.label}</option>`;
    });
    
    fakerRow.innerHTML = `
      <label>Faker Type:</label>
      <select class="faker-select">${optionsHtml}</select>
    `;
    
    fakerRow.querySelector('select')?.addEventListener('change', (e) => {
      param.fakerType = (e.target as HTMLSelectElement).value;
      this.notifyParametersChange();
    });
    
    return fakerRow;
  }

  private createValuesInput(param: Parameter): HTMLElement {
    const valuesRow = document.createElement('div');
    valuesRow.className = 'form-row';
    valuesRow.innerHTML = `
      <label>Values:</label>
      <input type="text" class="values-input" placeholder="{value1}{value2}" value="${param.values}" />
    `;
    
    valuesRow.querySelector('input')?.addEventListener('input', (e) => {
      param.values = (e.target as HTMLInputElement).value;
      this.notifyParametersChange();
    });
    
    return valuesRow;
  }

  private removeParameter(paramId: string) {
    const index = this.parameters.findIndex(p => p.id === paramId);
    if (index !== -1) {
      this.parameters.splice(index, 1);
      
      // Update active parameter
      if (this.activeParameterId === paramId) {
        this.activeParameterId = this.parameters.length > 0 ? this.parameters[0].id : null;
      }
      
      this.render();
      this.notifyParametersChange();
    }
  }
}

// Register the custom element
customElements.define('parameter-component', ParameterComponent); 