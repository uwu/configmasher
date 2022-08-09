export interface Config {
	defaults?: Object;
	name?: string;
	cwd?: string;
	
	dotenv?: boolean;
	processenv?: boolean;

	guessFiles?: boolean;

	caseinsensitive?: boolean;

	configs?: any[];
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