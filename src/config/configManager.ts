import * as vscode from 'vscode';
import { StreamControlConfig, TabConfig, OutputTabConfig, GlobalConfig } from './types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Map<string, TabConfig>;

  private constructor() {
    this.config = new Map();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): Map<string, TabConfig> {
    return this.config;
  }

  public getTabConfig(tabId: string): TabConfig | undefined {
    return this.config.get(tabId);
  }

  public updateTabConfig(tabId: string, updates: Partial<TabConfig>): void {
    const currentConfig = this.config.get(tabId) || {
      id: tabId,
      jsonTemplate: '',
      sendInterval: 0,
      topic: '',
      brokerAddress: '',
      isPaused: true,
      isRandomized: false
    };

    this.config.set(tabId, {
      ...currentConfig,
      ...updates
    });
  }

  public deleteTabConfig(tabId: string): void {
    this.config.delete(tabId);
  }

  public updateInputTab(tabId: string, updates: Partial<TabConfig>): void {
    const tab = this.config.get(tabId);
    if (tab) {
      Object.assign(tab, updates);
    }
  }

  public updateOutputTab(tabId: string, updates: Partial<OutputTabConfig>): void {
    const tab = this.config.get(tabId);
    if (tab) {
      Object.assign(tab, updates);
    }
  }

  public updateGlobalConfig(updates: Partial<GlobalConfig>): void {
    // Implementation needed
  }

  public getInputTab(tabId: string): TabConfig | undefined {
    return this.config.get(tabId);
  }

  public getOutputTab(tabId: string): OutputTabConfig | undefined {
    // Implementation needed
    return undefined;
  }
} 