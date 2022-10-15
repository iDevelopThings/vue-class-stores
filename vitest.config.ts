/// <reference types="vitest" />

import path from "path";
import {defineConfig} from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import Inspect from 'vite-plugin-inspect';
import {ClassStoresPlugin} from "./src/VitePlugin";

export default defineConfig({
	plugins : [
		Inspect({
			dev       : true,
			outputDir : '.vite-inspect',
		}),
		ClassStoresPlugin({
			storesPath     : 'src/Test/Stores',
			storesFileName : 'stores.d.ts',
		}),
		Vue(),
	],
	resolve : {
		alias : {
			'@idevelopthings/vue-class-stores/vue'       : path.resolve(__dirname, './src/Lib/index.ts'),
			'@idevelopthings/vue-class-stores/dev-tools' : path.resolve(__dirname, './src/DevTools/index.ts'),
			'@idevelopthings/vue-class-stores/vite'      : path.resolve(__dirname, './src/VitePlugin/index.ts'),
		},
	},
	test    : {
		globals     : true,
		environment : 'jsdom',
	},
});
