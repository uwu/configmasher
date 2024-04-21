const path = require("node:path");

const loadConfig = require("../dist/index.cjs");

(async () => {
    console.time("config load");
    
    const { config, layers } = await loadConfig({
        environmentFile: true,
        processEnvironment: true,
        
        cwd: path.join(__dirname, "configs"),
    
        configs: [
            { "jsonobject": "hello from a json object" },
            "jsonfile.json",
            "hello.env"
        ]
    });
    
    console.timeEnd("config load");
    console.log(config);
})();
