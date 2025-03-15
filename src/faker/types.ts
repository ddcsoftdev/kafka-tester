import { faker } from '@faker-js/faker';

export function getFakerTypes(): string[] {
    const types: string[] = [];
    
    // Helper function to recursively get all methods
    function getMethodsRecursively(obj: any, prefix: string = '') {
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'function' && !key.startsWith('_')) {
                types.push(prefix ? `${prefix}.${key}` : key);
            } else if (typeof value === 'object' && value !== null) {
                getMethodsRecursively(value, prefix ? `${prefix}.${key}` : key);
            }
        }
    }

    // Get all faker methods
    getMethodsRecursively(faker);

    return types.sort();
} 