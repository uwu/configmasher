import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

import tsPlugin from "rollup-plugin-typescript2";
import esbuild from "rollup-plugin-esbuild";

export default {
  input: "src/index.ts",
  output: [
		{
			file: "dist/index.mjs",
			format: "es"
		},
		{
			file: "dist/index.cjs",
			format: "cjs",
			exports: "default"
		}
	],

	plugins: [
		tsPlugin(),
		
		json(),
		commonjs(),
		nodeResolve(),
		
		esbuild({
			minify: true
		})
	]
};