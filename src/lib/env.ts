import { Config } from "./types";

import defu from "defu";

function parseEnvEntry(key: string, value: any): Object {
	const accessor = key.toLowerCase().split("__");
	accessor.shift();

	const finalObject = {};

	if(accessor.length === 1) {
		finalObject[accessor[0]] = value;
	} else if(accessor.length > 1) {
		accessor.reduce((a, b, index, array) => {
			if(array.length === index+1) {
				return a[b] = value;
			} else {
				return a[b] = {};
			}
		}, finalObject);
	}

	return finalObject;
}

export default function parseEnvEntries(config: Config, entries: [string, unknown][]): Object {
	let finalObject = {};

	for(const [key, value] of entries) {
		if(key.toLowerCase().startsWith(config.name.toLowerCase())) {
			finalObject = defu(finalObject, parseEnvEntry(key, value));
		}
	}

	return finalObject;
}