import { existsSync as fileExists } from "node:fs";
import path from "node:path";

export const isObject = (obj: any) => obj.__proto__ === Object.prototype;
export const uniqueArray = (arr: any[]): any[] => [...new Set(arr)];

export function caseInsensitiveProxy(obj): typeof Proxy {
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
	for (let [key, value] of Object.entries(obj)) {
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