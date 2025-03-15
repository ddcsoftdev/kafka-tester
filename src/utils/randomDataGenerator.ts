import { faker } from '@faker-js/faker';

export interface RandomParam {
    id: string;
    name: string;
    type: string;
    isRandomized: boolean;
    manualValues: string[];
    constraints: any[];
    isExpanded: boolean;
}

export function getFakerTypes(): string[] {
    const types: string[] = [];
    
    // Helper function to recursively get all faker methods
    function extractMethods(obj: any, prefix: string = '') {
        for (const key in obj) {
            if (typeof obj[key] === 'function' && key !== '_') {
                types.push(prefix ? `${prefix}.${key}` : key);
            } else if (typeof obj[key] === 'object' && key !== '_' && obj[key] !== null) {
                extractMethods(obj[key], prefix ? `${prefix}.${key}` : key);
            }
        }
    }

    // Extract all faker methods
    extractMethods(faker);
    
    // Sort alphabetically
    return types.sort();
}

export function generateRandomValue(param: RandomParam): any {
    if (!param.isRandomized) {
        // If not randomized, return a random value from manualValues
        return param.manualValues[Math.floor(Math.random() * param.manualValues.length)];
    }

    // Split the faker type into namespace and method
    const [namespace, ...methodParts] = param.type.split('.');
    const method = methodParts.join('.');

    try {
        // Get the faker function
        let fakerFunc = (faker as any)[namespace];
        if (method) {
            method.split('.').forEach(part => {
                fakerFunc = fakerFunc[part];
            });
        }

        // Generate the random value
        return fakerFunc();
    } catch (error) {
        console.error(`Failed to generate random value for type ${param.type}:`, error);
        return null;
    }
}

export class RandomDataGenerator {
    private static generateString(constraints: string[]): string {
        if (constraints.length === 0) {
            return faker.lorem.word();
        }
        
        // Handle specific string constraints
        const lengthConstraint = constraints.find(c => c.startsWith('length:'));
        if (lengthConstraint) {
            const length = parseInt(lengthConstraint.split(':')[1]);
            return faker.string.alpha(length);
        }
        
        const patternConstraint = constraints.find(c => c.startsWith('pattern:'));
        if (patternConstraint) {
            const pattern = patternConstraint.split(':')[1];
            return faker.string.alphanumeric(10); // Default to alphanumeric since pattern is not supported
        }
        
        return faker.lorem.word();
    }

    private static generateNumber(constraints: string[]): number {
        if (constraints.length === 0) {
            return faker.number.int();
        }

        let min = Number.MIN_SAFE_INTEGER;
        let max = Number.MAX_SAFE_INTEGER;
        let fractionDigits = 0;

        constraints.forEach(constraint => {
            if (constraint.startsWith('min:')) {
                min = parseFloat(constraint.split(':')[1]);
            } else if (constraint.startsWith('max:')) {
                max = parseFloat(constraint.split(':')[1]);
            } else if (constraint.startsWith('precision:')) {
                fractionDigits = parseInt(constraint.split(':')[1]);
            }
        });

        if (fractionDigits > 0) {
            return faker.number.float({ min, max, fractionDigits });
        }
        return faker.number.int({ min, max });
    }

    private static generateDate(constraints: string[]): string {
        if (constraints.length === 0) {
            return faker.date.recent().toISOString();
        }

        let from: Date | undefined;
        let to: Date | undefined;

        constraints.forEach(constraint => {
            if (constraint.startsWith('from:')) {
                from = new Date(constraint.split(':')[1]);
            } else if (constraint.startsWith('to:')) {
                to = new Date(constraint.split(':')[1]);
            }
        });

        return faker.date.between({ from: from || new Date(0), to: to || new Date() }).toISOString();
    }

    private static generateArray(constraints: string[]): any[] {
        let length = faker.number.int({ min: 1, max: 5 });
        let itemType = 'string';

        constraints.forEach(constraint => {
            if (constraint.startsWith('length:')) {
                length = parseInt(constraint.split(':')[1]);
            } else if (constraint.startsWith('itemType:')) {
                itemType = constraint.split(':')[1];
            }
        });

        return Array.from({ length }, () => this.generateValue({ type: itemType, constraints: [] }));
    }

    public static generateValue(param: Partial<RandomParam>): any {
        switch (param.type) {
            case 'uuid':
                return faker.string.uuid();
            case 'string':
                return this.generateString(param.constraints || []);
            case 'number':
                return this.generateNumber(param.constraints || []);
            case 'date':
                return this.generateDate(param.constraints || []);
            case 'boolean':
                return faker.datatype.boolean();
            case 'array':
                return this.generateArray(param.constraints || []);
            default:
                return faker.lorem.word();
        }
    }

    public static generateData(template: string, params: RandomParam[]): string {
        let result = template;
        params.forEach(param => {
            const value = this.generateValue(param);
            result = result.replace(new RegExp(`\\{\\{${param.name}\\}\\}`, 'g'), JSON.stringify(value));
        });
        return result;
    }
} 