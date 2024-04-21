import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";

import { uniqueArrayFilter, isObject, resolvePath, caseInsensitiveProxy, lowercaseObject } from "./lib/generic.js";
import { Config, Layer, ConfigReturn } from "./lib/types.js";
import parseEnvEntries from "./lib/env.js";

import { default as dotenv } from "dotenv";
import { defu } from "defu";

async function doLayer(config: Config, data: any): Promise<Layer> {
    const layerData: Layer = {
        input: data,
        value: {},
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
                layerData.value = JSON.parse(fileContents);
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

    if(layerData.value && (layerData.type == "JSON_FILE" || layerData.type == "OBJECT") && config.caseinsensitive) {
        layerData.value = lowercaseObject(layerData.value);
    }

    return layerData;
}

export default async function loadConfig<ReturnType = any>(config: Config): Promise<ConfigReturn<ReturnType>> {
    config = defu<Config, [Config]>(config, {
        defaults: {},
        name: "config",
        cwd: process.cwd(),

        dotenv: true,
        processenv: true,

        guessFiles: true,

        caseinsensitive: false,

        configs: []
    });

    if(config.guessFiles) {
        const guessRegex = new RegExp(`^${config.name}\.(env|json)`, config.caseinsensitive ? "i" : "");
        for(const file of await fs.readdir(config.cwd)) {
            if(file.match(guessRegex)) {
                config.configs.push(path.join(file));
            }
        }
    }

    if(config.dotenv && config.cwd) {
        config.configs.push(path.resolve(config.cwd, ".env"));
    }
    if(config.processenv) config.configs.push(process.env);

    config.configs = config.configs.filter(uniqueArrayFilter);

    let finalConfig: any = config.defaults;
    const layerPromises: Promise<Layer>[] = [];
    const layers: Layer[] = [];

    for(const i in config.configs) {
        layerPromises[i] = doLayer(config, config.configs[i]);
    }

    await Promise.all(layerPromises);

    for(const i in layerPromises) {
        layers[i] = await layerPromises[i];
        finalConfig = defu(layers[i].value, finalConfig);
    }
    
    if(config.caseinsensitive) {
        finalConfig = caseInsensitiveProxy(finalConfig);
    }

    const missingEntries = [];
    for(const i in config.mandatory) {
        let entry = config.mandatory[i];

        if(Array.isArray(entry) && entry.length > 0) {
            entry = entry as string[];

            let lastObject = finalConfig;
            for(let i = 0; i < entry.length; i++) {
                lastObject = lastObject[entry[i]];
                if(!lastObject) {
                    missingEntries.push(entry.join("."));
                    break;
                }
            }
        } else if(typeof(entry) == "string") {
            if(!finalConfig[entry]) {
                missingEntries.push(entry);
            }
        }
    }

    if(missingEntries.length > 0) {
        let missingEntriesText = missingEntries.join(", ");
        throw Error(`Configuration is missing the following entries : ${config.caseinsensitive ? missingEntriesText.toLowerCase(): missingEntriesText}`);
    }

    return { config: finalConfig, layers };
}