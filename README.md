# configmasher

``configmasher`` is a config aggregator, it will reunite all your configs from different locations and different formats into a single object.

it was heavily inspired by [unjs](https://github.com/unjs)'s [c12](https://github.com/unjs/c12) project.

## Install

```sh
npm i @uwu/configmasher
```

## Example

The config files used in this example are available [here](https://github.com/uwu/configmasher/tree/main/example/configs)

```tree
configs
├─── .env
├─── hello.env
└─── jsonfile.json
```

```js
// CommonJS
const loadConfig = require("configmasher");

// ESM
import loadConfig from "configmasher";

const { config, layers } = await loadConfig({
  environmentFile: true,
  processEnvironment: true,

  name: "myprogram",

  configs: [
    { "jsonobject": "hello from a json object" },
    "jsonfile.json",
    "hello.env"
  ],

  defaults: {
    "defaultEntry": "this is a default item",
    "helloenvfile": "this is a default entry that will be overwritten"
  }
});

console.log(config);
/*
{
  "helloprocessenv": "this will be config.helloprocessenv",
  "envfile": "hello from the .env file",
  "envfile2": "helo",
  "helloenvfile": "this will be config.helloenvfile",
  "nested": {
    "entry": "this will be config.nested.entry"
  },
  "jsonobject": "hello from a json object"
}
*/
```
