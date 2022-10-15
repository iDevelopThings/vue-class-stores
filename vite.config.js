import {defineConfig}      from 'vite';
import dts                 from "vite-plugin-dts";
import vue                 from '@vitejs/plugin-vue';
import Inspect             from 'vite-plugin-inspect';
import {ClassStoresPlugin} from './src/VitePlugin/ClassStoresPlugin';
import path                from 'path';

export default defineConfig({
	plugins : [
		dts({
			tsConfigFilePath : "./tsconfig.json",
			insertTypesEntry : true,
		}),

		Inspect({
			dev       : true,
			outputDir : '.vite-inspect',
		}),

		ClassStoresPlugin({
			storesPath : 'src/Test/Stores',
		}),

		vue(),
	],
	resolve : {
		alias : {
			'@idevelopthings/vue-class-stores/vue'       : path.resolve(__dirname, './src/Lib/index.ts'),
			'@idevelopthings/vue-class-stores/dev-tools' : path.resolve(__dirname, './src/DevTools/index.ts'),
			'@idevelopthings/vue-class-stores/vite'      : path.resolve(__dirname, './src/VitePlugin/index.ts'),
		},
	},
	build   : {
		outDir    : 'dist',
		sourcemap : true,
		lib       : {
			name     : 'VueClassStores',
			entry    : './src/index.ts',
			fileName : 'index',
			formats  : ['es', 'cjs', 'umd', 'iife'],
		},

		rollupOptions : {
			external : ['vue', 'lodash', 'klona'],
			output   : {
				globals : {
					vue    : 'Vue',
					lodash : '_',
					klona  : 'klona',
				},
			},
		},
	},
});
