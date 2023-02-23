import { existsSync as fileExists } from "node:fs";
import path from "node:path";

export function isObject(obj: any) {
	// faster than obj.__proto__ === Object.prototype but doesn't account for classes.
	return typeof(obj) === "object" && !Array.isArray(obj);
}

export function uniqueArrayFilter(value: any, index: number, array: any[]) {
	return array.indexOf(value) === index;
}

export function caseInsensitiveProxy(obj: any): typeof Proxy {
	return new Proxy(obj, {
		get(dest, prop) {
			if(typeof(prop) === "string") {
				prop = prop.toLowerCase();
			}

			return dest[prop];
		},

		set(dest, prop, value) {
			if(typeof(prop) === "string") {
				prop = prop.toLowerCase();
			}

			return dest[prop] = value;
		}
	});
}

export function lowercaseObject(obj) {
	let entries = Object.entries(obj);
	for (let i = 0; i < entries.length; i++) {
		let key = entries[i][0];
		let value = entries[i][1];

		if (isObject(value)) {
			value = lowercaseObject(value);
		}

		let lowerKey = key.toLowerCase();
		if(typeof(key) === "string" && key !== lowerKey) {
			delete obj[key];

			obj[lowerKey] = value;
		}
	}

	return obj;
}

export function resolvePath(cwd: string, filePath: string): string {
	if(fileExists(filePath)) {
		return filePath;
	} else {
		const relativePath = path.join(cwd, filePath);
		if(fileExists(relativePath)) {
			return relativePath;
		}
	}

	throw Error(`File with path "${filePath}" does not exist`);
}