export interface TabConfig {
  id: string;
  jsonTemplate: string;
  sendInterval: number;
  topic: string;
  brokerAddress: string;
  isPaused: boolean;
  isRandomized: boolean;
}

export interface OutputTabConfig {
  id: string;
  topic: string;
  brokerAddress: string;
  isConnected: boolean;
}

export interface GlobalConfig {
  useLocalBroker: boolean;
  batchSize: number;
  repeatCount: number;
}

export interface StreamControlConfig {
  inputTabs: TabConfig[];
  outputTabs: OutputTabConfig[];
  global: GlobalConfig;
} 