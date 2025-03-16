export interface OutputMessage {
    key: string;
    value: string;
    partition: number;
    offset: number;
    timestamp: number;
}

export interface Output {
    id: string;
    topic: string;
    broker: string;
    isConnected: boolean;
    messages: OutputMessage[];
} 