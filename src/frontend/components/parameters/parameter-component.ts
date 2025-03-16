/**
 * Parameter Component
 * 
 * A web component for managing parameters with support for random values and faker types.
 */

// Types
export interface Parameter {
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

/**
 * ParameterComponent - A web component for managing parameters
 * 
 * Features:
 * - Tab-based interface for multiple parameters
 * - Support for random values using faker types
 * - Custom styling using VSCode theme variables
 */
export class ParameterComponent extends HTMLElement {
  // DOM Elements
  private tabContainer: HTMLDivElement;
  private contentContainer: HTMLDivElement;
  
  // State
  private parameters: Parameter[] = [];
  private activeParameterId: string | null = null;
  private onParametersChange?: (parameters: Parameter[]) => void;
  
  // VSCode theme variables
  private readonly theme = {
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

  /**
   * Constructor - Initialize the component
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize DOM elements
    this.tabContainer = document.createElement('div');
    this.contentContainer = document.createElement('div');
    
    this.init();
  }

  /**
   * Connected callback - Called when the element is added to the DOM
   */
  connectedCallback() {
    this.render();
  }

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
    wrapper.className = 'parameter-wrapper';

    // Header section with title and add button
    const header = this.createHeader();

    // Tab container
    this.tabContainer.className = 'tab-container';
    
    // Content container
    this.contentContainer.className = 'content-container';

    wrapper.appendChild(header);
    wrapper.appendChild(this.tabContainer);
    wrapper.appendChild(this.contentContainer);

    this.shadowRoot!.appendChild(wrapper);
  }

  /**
   * Create the header section with title and add button
   */
  private createHeader(): HTMLElement {
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
    
    return header;
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

  /**
   * Render the tabs for each parameter
   */
  private renderTabs() {
    this.tabContainer.innerHTML = '';
    
    this.parameters.forEach(param => {
      const tab = this.createTabElement(param);
      this.tabContainer.appendChild(tab);
    });
  }

  /**
   * Create a tab element for a parameter
   */
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

  /**
   * Render the content for a parameter
   */
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

  /**
   * Create the name input field
   */
  private createNameInput(param: Parameter): HTMLElement {
    const nameRow = document.createElement('div');
    nameRow.className = 'form-row';
    nameRow.innerHTML = `
      <label>Name:</label>
      <input type="text" value="${param.name}" style="width: 120px;" />
    `;
    
    const input = nameRow.querySelector('input');
    if (input) {
      // Update name in the parameter object on each keystroke
      input.addEventListener('input', (e) => {
        param.name = (e.target as HTMLInputElement).value;
        // Don't re-render the tabs on every keystroke
        this.notifyParametersChange();
      });
      
      // Update the UI only when the input loses focus or Enter is pressed
      input.addEventListener('blur', () => {
        this.renderTabs();
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.renderTabs();
          input.blur();
        }
      });
    }
    
    return nameRow;
  }

  /**
   * Create the random checkbox
   */
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

  /**
   * Create the faker type select field
   */
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

  /**
   * Create the values input field
   */
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

  /**
   * Add a new parameter
   */
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

  /**
   * Remove a parameter
   */
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

  /**
   * Notify that parameters have changed
   */
  private notifyParametersChange() {
    if (this.onParametersChange) {
      this.onParametersChange([...this.parameters]);
    }
  }

  /**
   * Get the component styles
   */
  private getStyles(): string {
    return `
      :host {
        display: block;
        font-family: ${this.theme.font};
        color: ${this.theme.foreground};
      }

      .parameter-wrapper {
        background: ${this.theme.background};
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
        font-size: ${this.theme.fontSize};
        font-weight: 600;
        color: ${this.theme.foreground};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .add-parameter-btn {
        padding: 3px 8px;
        border: 1px solid ${this.theme.buttonBorder};
        border-radius: 2px;
        background: ${this.theme.buttonBg};
        color: ${this.theme.buttonFg};
        font-size: ${this.theme.fontSize};
        cursor: pointer;
      }

      .add-parameter-btn:hover {
        background: ${this.theme.buttonHoverBg};
      }

      .tab-container {
        display: flex;
        gap: 4px;
        margin-bottom: 12px;
        flex-wrap: wrap;
        border-bottom: 1px solid ${this.theme.border};
        padding-bottom: 8px;
      }

      .tab {
        padding: 4px 8px;
        border: 1px solid ${this.theme.border};
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        background: ${this.theme.background};
        font-size: ${this.theme.fontSize};
        transition: all 0.1s ease;
      }

      .tab:hover {
        background: ${this.theme.listHoverBg};
      }

      .tab.active {
        background: ${this.theme.listActiveBg};
        color: ${this.theme.listActiveFg};
      }

      .tab-close {
        border: none;
        background: none;
        cursor: pointer;
        padding: 1px 4px;
        border-radius: 2px;
        color: ${this.theme.iconFg};
        font-size: 12px;
        line-height: 1;
      }

      .tab-close:hover {
        background: ${this.theme.toolbarHoverBg};
      }

      .parameter-form {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        background: ${this.theme.background};
        border: 1px solid ${this.theme.border};
        border-radius: 3px;
      }

      .form-row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .form-row label {
        font-size: ${this.theme.fontSize};
        color: ${this.theme.foreground};
        white-space: nowrap;
      }

      input[type="text"] {
        flex: 1;
        min-width: 0;
        padding: 3px 6px;
        border: 1px solid ${this.theme.inputBorder};
        border-radius: 2px;
        font-size: ${this.theme.fontSize};
        background: ${this.theme.inputBg};
        color: ${this.theme.inputFg};
      }

      input[type="text"]:focus {
        outline: none;
        border-color: ${this.theme.focusBorder};
      }

      input[type="checkbox"] {
        width: 14px;
        height: 14px;
        border: 1px solid ${this.theme.border};
        border-radius: 2px;
        cursor: pointer;
        background: ${this.theme.inputBg};
      }

      select {
        padding: 3px 6px;
        border: 1px solid ${this.theme.inputBorder};
        border-radius: 2px;
        background: ${this.theme.inputBg};
        color: ${this.theme.inputFg};
        font-size: ${this.theme.fontSize};
        min-width: 140px;
        cursor: pointer;
      }

      select:focus {
        outline: none;
        border-color: ${this.theme.focusBorder};
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
}

// Register the custom element
customElements.define('parameter-component', ParameterComponent); 