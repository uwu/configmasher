import { Config } from "./types";

import defu from "defu";

function parseEnvEntry(key: string, value: any): Object {
    const accessor = key.split(/__+/g);

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
    const nameRegex = new RegExp(`^${config.name}_+`, "gm" + (config.caseinsensitive ? "i" : ""));
    let finalObject = {};

    for(let [key, value] of entries) {
        let matches;

        if(matches = key.match(nameRegex)) {
            key = key.replace(matches[0], "");
            if(config.caseinsensitive) key = key.toLowerCase();

            finalObject = defu(finalObject, parseEnvEntry(key, value));
        }
    }

    return finalObject;
}