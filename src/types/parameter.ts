export interface Parameter {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    value: string | number | boolean | object;
    required: boolean;
    description?: string;
    defaultValue?: any;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: any[];
    };
} 