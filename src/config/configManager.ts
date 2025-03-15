import * as vscode from 'vscode';
import { StreamControlConfig, TabConfig, OutputTabConfig, GlobalConfig } from './types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: StreamControlConfig;

  private constructor() {
    this.config = {
      inputTabs: Array(3).fill(null).map((_, i) => ({
        id: `input-${i + 1}`,
        jsonTemplate: '{"id": 1, "message": "test"}',
        sendInterval: 5,
        topic: `test-topic-${i + 1}`,
        brokerAddress: 'localhost:9092',
        isPaused: false,
        isRandomized: false
      })),
      outputTabs: Array(3).fill(null).map((_, i) => ({
        id: `output-${i + 1}`,
        topic: `test-topic-${i + 1}`,
        brokerAddress: 'localhost:9092',
        isConnected: false
      })),
      global: {
        useLocalBroker: false,
        batchSize: 1,
        repeatCount: 0
      }
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): StreamControlConfig {
    return this.config;
  }

  public updateInputTab(tabId: string, updates: Partial<TabConfig>): void {
    const tab = this.config.inputTabs.find(t => t.id === tabId);
    if (tab) {
      Object.assign(tab, updates);
    }
  }

  public updateOutputTab(tabId: string, updates: Partial<OutputTabConfig>): void {
    const tab = this.config.outputTabs.find(t => t.id === tabId);
    if (tab) {
      Object.assign(tab, updates);
    }
  }

  public updateGlobalConfig(updates: Partial<GlobalConfig>): void {
    Object.assign(this.config.global, updates);
  }

  public getInputTab(tabId: string): TabConfig | undefined {
    return this.config.inputTabs.find(t => t.id === tabId);
  }

  public getOutputTab(tabId: string): OutputTabConfig | undefined {
    return this.config.outputTabs.find(t => t.id === tabId);
  }
} 