export interface Config extends Object {
	defaults?: Object;
	name?: string;
	cwd?: string;
	
	dotenv?: boolean;
	processenv?: boolean;

	guessFiles?: boolean;

	caseinsensitive?: boolean;

	configs?: any[];
	mandatory?: (string[] | string)[];
}

export interface Layer {
	type: string;

	input: any;
	value?: any;
	error?: Error;
}

export interface ConfigReturn {
	config: any;
	layers: Layer[];
}