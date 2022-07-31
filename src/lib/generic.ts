import { existsSync as fileExists } from "node:fs";
import path from "node:path";

export const isObject = (obj: any) => obj.__proto__ === Object.prototype;
export const uniqueArray = (arr: any[]): any[] => [...new Set(arr)];

export function isJSON(str: string): Object | false {
	let result;

	try {
		result = JSON.parse(str);
	} catch(e) {
		return false;
	}

	return result;
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