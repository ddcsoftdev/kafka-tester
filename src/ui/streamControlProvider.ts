import * as vscode from 'vscode';
import { BaseWebviewProvider } from './baseWebview';
import { ConfigManager } from '../config/configManager';
import { sendToKafka, startProducer } from '../kafka/producer';
import { consumeFromKafka } from '../kafka/consumer';
import { startLocalBroker, stopLocalBroker } from '../kafka/localBroker';
import { RandomParam, getFakerTypes } from '../utils/randomDataGenerator';

type MessageHandler = (data: any) => void;

export class KafkaStreamProvider extends BaseWebviewProvider {
  private configManager: ConfigManager;
  private producers: Map<string, () => void>;
  private consumers: Map<string, () => void>;
  private randomParams: Map<string, RandomParam[]>;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri, 'kafka-stream-tester');
    this.configManager = ConfigManager.getInstance();
    this.producers = new Map();
    this.consumers = new Map();
    this.randomParams = new Map();
  }

  public get extensionUri(): vscode.Uri {
    return this._extensionUri;
  }

  public getHtmlForWebview(webview: vscode.Webview): string {
    return this._getHtmlContent(webview);
  }

  public handleMessage(message: any): void {
    switch (message.command) {
      case 'send':
        this.handleSend(message);
        break;
      case 'togglePause':
        this.handleTogglePause(message);
        break;
      case 'toggleConnect':
        this.handleToggleConnect(message);
        break;
      case 'updateGlobalConfig':
        this.handleGlobalConfig(message);
        break;
      case 'addRandomParam':
        this.handleAddRandomParam(message);
        break;
      case 'updateRandomParam':
        this.handleUpdateRandomParam(message);
        break;
      case 'addConstraint':
        this.handleAddConstraint(message);
        break;
      case 'toggleParamExpand':
        this.handleToggleParamExpand(message);
        break;
    }
  }

  protected _getHtmlContent(webview: vscode.Webview): string {
    const html = this._getHtmlFile('streamControl.html');
    return html.replace('#{webview.cspSource}', webview.cspSource);
  }

  protected _setWebviewMessageListener(webview: vscode.Webview): void {
    webview.onDidReceiveMessage(message => {
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message.data));
      }

      switch (message.type) {
        case 'toggleLocalBroker':
          this._handleToggleLocalBroker(message.data);
          break;
        case 'toggleConnect':
          this._handleToggleConnect(message.data);
          break;
        case 'togglePause':
          this._handleTogglePause(message.data);
          break;
        case 'addRandomParam':
          this._handleAddRandomParam(message.data);
          break;
        case 'updateRandomParam':
          this._handleUpdateRandomParam(message.data);
          break;
        case 'addConstraint':
          this._handleAddConstraint(message.data);
          break;
        case 'toggleParamExpand':
          this._handleToggleParamExpand(message.data);
          break;
      }
    });
  }

  protected _onWebviewReady(webview: vscode.Webview): void {
    // Send Faker types to the webview
    webview.postMessage({
      type: 'updateFakerTypes',
      types: getFakerTypes()
    });
  }

  private handleAddRandomParam(message: any): void {
    const { tabId } = message;
    if (!this.randomParams.has(tabId)) {
      this.randomParams.set(tabId, []);
    }
    
    const params = this.randomParams.get(tabId)!;
    const newParam: RandomParam = {
      id: `param-${Date.now()}`,
      name: `param${params.length + 1}`,
      type: '',
      isRandomized: false,
      manualValues: ['', '', ''],
      constraints: [],
      isExpanded: true
    };
    
    params.push(newParam);
    this.updateRandomParamsUI(tabId);
  }

  private handleUpdateRandomParam(message: any): void {
    const { tabId, paramId, updates } = message;
    const params = this.randomParams.get(tabId);
    if (params) {
      const param = params.find(p => p.id === paramId);
      if (param) {
        Object.assign(param, updates);
        this.updateRandomParamsUI(tabId);
      }
    }
  }

  private handleAddConstraint(message: any): void {
    const { tabId, paramId, constraint } = message;
    const params = this.randomParams.get(tabId);
    if (params) {
      const param = params.find(p => p.id === paramId);
      if (param) {
        param.constraints.push(constraint);
        this.updateRandomParamsUI(tabId);
      }
    }
  }

  private handleToggleParamExpand(message: any): void {
    const { tabId, paramId } = message;
    const params = this.randomParams.get(tabId);
    if (params) {
      const param = params.find(p => p.id === paramId);
      if (param) {
        param.isExpanded = !param.isExpanded;
        this.updateRandomParamsUI(tabId);
      }
    }
  }

  private updateRandomParamsUI(tabId: string): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateRandomParams',
        tabId,
        params: this.randomParams.get(tabId) || []
      });
    }
  }

  private async handleSend(message: any): Promise<void> {
    try {
      await sendToKafka(message.topic, message.broker, message.template);
      this.addOutputMessage(message.tabId, `Sent message to ${message.topic}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to send message: ${error}`);
    }
  }

  private handleTogglePause(message: any): void {
    const { tabId, isPaused } = message;
    this.configManager.updateInputTab(tabId, { isPaused });
    
    if (isPaused) {
      const stopProducer = this.producers.get(tabId);
      if (stopProducer) {
        stopProducer();
        this.producers.delete(tabId);
      }
    } else {
      const tab = this.configManager.getInputTab(tabId);
      if (tab) {
        this.startProducerForTab(tab);
      }
    }
  }

  private async handleToggleConnect(message: any): Promise<void> {
    const { tabId, isConnected, topic, broker } = message;
    this.configManager.updateOutputTab(tabId, { isConnected, topic, brokerAddress: broker });

    if (isConnected) {
      try {
        const stopConsumer = await consumeFromKafka(topic, broker, (msg) => {
          this.addOutputMessage(tabId, msg);
        });
        this.consumers.set(tabId, stopConsumer);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to connect consumer: ${error}`);
      }
    } else {
      const stopConsumer = this.consumers.get(tabId);
      if (stopConsumer) {
        stopConsumer();
        this.consumers.delete(tabId);
      }
    }
  }

  private async handleGlobalConfig(message: any): Promise<void> {
    if ('useLocalBroker' in message) {
      try {
        if (message.useLocalBroker) {
          const brokerAddress = await startLocalBroker();
          vscode.window.showInformationMessage(`Local broker started at ${brokerAddress}`);
        } else {
          await stopLocalBroker();
          vscode.window.showInformationMessage('Local broker stopped');
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to manage local broker: ${error}`);
      }
    }
    this.configManager.updateGlobalConfig(message);
  }

  private async startProducerForTab(tab: any): Promise<void> {
    const stopProducer = await startProducer(
      tab.topic,
      tab.brokerAddress,
      tab.sendInterval,
      () => tab.jsonTemplate,
      () => this.randomParams.get(tab.id) || [],
      (msg) => this.addOutputMessage(tab.id, `Sent: ${msg}`)
    );
    this.producers.set(tab.id, stopProducer);
  }

  private addOutputMessage(tabId: string, text: string): void {
    if (this._view) {
      this._view.webview.postMessage({ type: 'addOutput', tabId, text });
    }
  }

  onMessage(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _handleToggleLocalBroker(data: any) {
    const { isEnabled } = data;
    if (isEnabled) {
      startLocalBroker();
    } else {
      stopLocalBroker();
    }
  }

  private _handleToggleConnect(data: any) {
    const { tabId, isConnected } = data;
    if (isConnected) {
      // Start consumer
      const consumer = () => {
        // Implement consumer logic
      };
      this.consumers.set(tabId, consumer);
    } else {
      // Stop consumer
      const consumer = this.consumers.get(tabId);
      if (consumer) {
        consumer();
        this.consumers.delete(tabId);
      }
    }
  }

  private _handleTogglePause(data: any) {
    // Implement pause/resume logic
  }

  private _handleAddRandomParam(data: any) {
    const { tabId, param } = data;
    if (!this.randomParams.has(tabId)) {
      this.randomParams.set(tabId, []);
    }
    this.randomParams.get(tabId)?.push(param);
  }

  private _handleUpdateRandomParam(data: any) {
    const { tabId, paramId, updates } = data;
    const params = this.randomParams.get(tabId);
    if (params) {
      const param = params.find(p => p.id === paramId);
      if (param) {
        Object.assign(param, updates);
      }
    }
  }

  private _handleAddConstraint(data: any) {
    // Implement constraint logic
  }

  private _handleToggleParamExpand(data: any) {
    // Implement param expand/collapse logic
  }
} 