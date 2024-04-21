import { existsSync as fileExists } from "node:fs";
import path from "node:path";

/**
 * Determine whether the {@link input} is an object or not.
 * 
 * @param input The input to check.
 * @returns Whether the {@link input} is an object or not.
 */
export function isObject(input: any): boolean {
    // faster than obj.__proto__ === Object.prototype but doesn't account for classes which we don't really care about.
    return typeof(input) === "object" && !Array.isArray(input);
}

/**
 * Filter function to be used with Array#filter to remove duplicate values from an array.
 */
export function uniqueArrayFilter(value: any, index: number, array: any[]) {
    return array.indexOf(value) === index;
}

/**
 * Create a proxy that makes all keys case insensitive.
 * 
 * @param object The object to proxy.
 * @returns The case insensitive proxy.
 */
export function caseInsensitiveProxy(object: any): typeof Proxy {
    return new Proxy(object, {
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

/**
 * Recursively lowercase all keys in an object.
 * 
 * @param object The object to lowercase.
 * @returns The lowercased object.
 */
export function lowercaseObject(object: Object): Object {
    const entries = Object.entries(object);

    for (let i = 0; i < entries.length; i++) {
        let key = entries[i][0];
        let value = entries[i][1];

        if (isObject(value)) {
            value = lowercaseObject(value);
        }

        let lowerKey = key.toLowerCase();
        if(typeof(key) === "string" && key !== lowerKey) {
            delete object[key];

            object[lowerKey] = value;
        }
    }

    return object;
}

/**
 * Resolve a path to a file and check whether it exists or not in the process.
 * 
 * If the {@link filePath file path} is an absolute path, then it is returned as is.
 * 
 * Otherwise, we try to resolve it based on the passed {@link workingDirectory working directory}.
 * 
 * @param workingDirectory The working directory to resolve the path from.
 * @param filePath The file path to resolve.
 * @returns The resolved path.
 */
export function resolvePath(workingDirectory: string, filePath: string): string {
    const resolvedPath = path.resolve(workingDirectory, filePath);

    if(fileExists(resolvedPath)) {
        return resolvedPath;
    } else {
        throw Error(`File with path "${resolvedPath}" does not exist`);
    }
}