import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";

import { uniqueArrayFilter, isObject, resolvePath, caseInsensitiveProxy, lowercaseObject } from "./lib/generic.js";
import { Config, Layer, ConfigReturn } from "./lib/types.js";
import parseEnvEntries from "./lib/env.js";

import { default as dotenv } from "dotenv";
import { defu } from "defu";

/**
 * Parse the data of an {@link input} into a {@link Layer} object based on the {@link config}.
 * 
 * @param config The configuration that was passed to {@link loadConfig}.
 * @param input The input, can be an object, a string (file name), or process.env.
 * @returns Layer object.
 */
async function doLayer(config: Config, input: any): Promise<Layer> {
    const layerData: Layer = {
        input: input,
        value: {},
        type: "UNKNOWN"
    };

    try {
        // Determine the type of the layer (mostly used for clarity when trying to debug config loading issues)
        if(input === process.env) {
            layerData.type = "PROCESS_ENV";
        } else if(input === config.defaults) {
            layerData.type = "DEFAULTS";  
        } else if(isObject(input)) {
            layerData.type = "OBJECT";
        } else if(typeof(input) === "string") {
            if(input.endsWith(".json")) {
                layerData.type = "JSON_FILE";
            } else if(input.endsWith(".env")) {
                layerData.type = "ENV_FILE";				
            }
        }

        // Attempt to load the data based on the type of the layer
        switch(layerData.type) {
            case "OBJECT":
            case "DEFAULTS":
                layerData.value = input;
            break;

            case "JSON_FILE":
                const fileContents = await fs.readFile(resolvePath(config.cwd, input), "utf8");
                layerData.value = JSON.parse(fileContents);
            break;

            case "ENV_FILE":
                const result = dotenv.config({
                    path: resolvePath(config.cwd, input)
                });
    
                if(result.error) {
                    throw result.error;
                } else {
                    input = result.parsed;
                }
            case "PROCESS_ENV":
                layerData.value = parseEnvEntries(config, Object.entries(input));
            break;
        }
    } catch(e) {
        layerData.error = e as Error;
    }

    /*
        If config.caseInsensitive is set to true and the input was an object (checked using layerData.type),
        then we lowercase the object
    */
    if(config.caseInsensitive && layerData.value && (layerData.type == "JSON_FILE" || layerData.type == "OBJECT" || layerData.type == "DEFAULTS")) {
        layerData.value = lowercaseObject(layerData.value);
    }

    return layerData;
}

/**
 * Load a configuration based on the {@link config configuration}.
 * 
 * @param config The configuration to load the config based on.
 * @returns The final configuration object.
 */
export default async function loadConfig<ReturnType = any>(config: Config): Promise<ConfigReturn<ReturnType>> {
    config = defu<Config, [Config]>(config, {
        defaults: {},
        name: "config",
        cwd: process.cwd(),

        environmentFile: true,
        processEnvironment: true,

        guessFiles: true,

        caseInsensitive: false,

        configs: []
    });

    // Make config.defaults the first config layer
    config.configs.unshift(config.defaults);

    // If config.guessFiles is set to true, then we try to find json/env files that match the config.name within config.cwd
    if(config.guessFiles) {
        const guessRegex = new RegExp(`^${config.name}\.(env|json)`, config.caseInsensitive ? "i" : "");

        for(const file of await fs.readdir(config.cwd)) {
            if(file.match(guessRegex)) {
                config.configs.push(path.join(file));
            }
        }
    }

    // If config.environmentFile is set to true, then we try to find a .env file within config.cwd and push that to config.configs
    if(config.environmentFile && config.cwd) {
        config.configs.push(path.resolve(config.cwd, ".env"));
    }

    // If config.processEnvironment is set to true, then we push process.env to config.configs
    if(config.processEnvironment) {
        config.configs.push(process.env);
    }

    // We filter out config.configs to make sure that there are no duplicate entries
    config.configs = config.configs.filter(uniqueArrayFilter);

    let finalConfig: any = {};

    const layerPromises: Promise<Layer>[] = [];
    const layers: Layer[] = [];

    /*
        Loop through config.configs and create a promise for each layer to parallelize config loading,
        then add them to an array to preserve load order
    */
    for(const i in config.configs) {
        layerPromises[i] = doLayer(config, config.configs[i]);
    }

    // Wait for all layers to finish
    await Promise.all(layerPromises);

    // Loop through the layers and merge them into finalConfig
    for(const i in layerPromises) {
        layers[i] = await layerPromises[i];
        finalConfig = defu(layers[i].value, finalConfig);
    }
    
    // If config.caseInsensitive is set to true, then the final config object is wrapped in a case insensitive proxy
    if(config.caseInsensitive) {
        finalConfig = caseInsensitiveProxy(finalConfig);
    }

    // If there are any mandatory entries in config.mandatory, then we check if they exist in the final config object
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
        throw Error(`Configuration is missing the following entries : ${config.caseInsensitive ? missingEntriesText.toLowerCase(): missingEntriesText}`);
    }

    return { config: finalConfig, layers };
}