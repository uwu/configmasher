import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import loadConfig from "../src/index";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.time("config load");

const { config, layers } = await loadConfig({
    environmentFile: true,
    processEnvironment: true,

    caseInsensitive: false,
    guessFiles: false,

    cwd: path.join(__dirname, "configs"),

    configs: [
        { "jsonobject": "hello from a json object" },
        { 
            hello: { 
                yOo: "configmasher is now recursive",
            }
        },
        { 
            hello: { 
                hello: "configmasher is now recursive",
            }
        },
        "jsonfile.json",
        "hello.env"
    ]
});

console.timeEnd("config load");
console.log(config);