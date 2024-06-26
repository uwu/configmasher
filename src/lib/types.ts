export interface Config extends Object {
    defaults?: Object;
    name?: string;
    cwd?: string;
    
    environmentFile?: boolean;
    processEnvironment?: boolean;

    guessFiles?: boolean;

    caseInsensitive?: boolean;

    configs?: any[];
    mandatory?: (string[] | string)[];
}

export interface Layer {
    type: string;

    input: any;
    value?: any;
    error?: Error;
}

export interface ConfigReturn<ReturnType = any> {
    config: ReturnType;
    layers: Layer[];
}