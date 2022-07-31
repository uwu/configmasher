import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import getConfig from "../dist/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { config, layers } = await getConfig({
	dotenv: true,
	processenv: true,

	cwd: path.join(__dirname, "configs"),

	configs: [
		{ "jsonobject": "hello from a json object" },
		"jsonfile.json",
		"hello.env"
	]
});

console.log(config);
