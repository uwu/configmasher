import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";

import { uniqueArray, isObject, isJSON, resolvePath } from "./lib/generic.js";
import { Config, Layer, ConfigReturn } from "./lib/types.js";
import parseEnvEntries from "./lib/env.js";

import { default as dotenv } from "dotenv";
import { defu } from "defu";

async function doLayer(config: any, data: any): Promise<Layer> {
	const layerData: Layer = {
		input: data,
		type: "UNKNOWN"
	};

	try {
		if(data === process.env) {
			layerData.type = "PROCESS_ENV";
		} else if(isObject(data)) {
			layerData.type = "OBJECT";
		} else if(typeof(data) === "string") {
			if(data.endsWith(".json")) {
				layerData.type = "JSON_FILE";
			} else if(data.endsWith(".env")) {
				layerData.type = "ENV_FILE";				
			}
		}

		switch(layerData.type) {
			case "OBJECT":
				layerData.value = data;
			break;

			case "JSON_FILE":
				const fileContents = await fs.readFile(resolvePath(config.cwd, data), "utf8");
				layerData.value = isJSON(fileContents);
			break;

			case "ENV_FILE":
				const result = dotenv.config({
					path: resolvePath(config.cwd, data)
				});
	
				if(result.error) {
					throw result.error;
				} else {
					data = result.parsed;
				}
			case "PROCESS_ENV":
				layerData.value = parseEnvEntries(config, Object.entries(data));
			break;
		}
	} catch(e) {
		layerData.error = e as Error;
	}

	return layerData;
}

export default async function loadConfig(config: Config): Promise<ConfigReturn> {
	config = defu(config, {
		defaults: {},
		name: "config",
		cwd: process.cwd(),

		dotenv: true,
		processenv: true,

		configs: []
	});

	if(config.dotenv && config.cwd) {
		config.configs.push(path.resolve(config.cwd, ".env"));
	}
	if(config.processenv) config.configs.push(process.env);

	config.configs = uniqueArray(config.configs);

	const finalConfig: any = config.defaults;
	const layers: Layer[] = [];

	for(const i in config.configs) {
		layers[i] = await doLayer(config, config.configs[i]);
		Object.assign(finalConfig, layers[i].value);
	}
	
	return { config: finalConfig, layers };
}