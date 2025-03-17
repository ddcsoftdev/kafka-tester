export interface ParameterModel {
    id: string;
    name: string;
    isRandom: boolean;
    values: string;
    fakerType: string;
} 

export class Parameter implements ParameterModel {
    id: string;
    name: string;
    isRandom: boolean;
    values: string;
    fakerType: string;
 
    constructor(id: string, name: string, isRandom: boolean, values: string, fakerType: string) {
        this.id = id;
        this.name = name;
        this.isRandom = isRandom;
        this.values = values;
        this.fakerType = fakerType;
    }

    static toJson(): string {
        return JSON.stringify(this);
    }

    static fromJson(json: string): Parameter {
        return JSON.parse(json);
    }
}