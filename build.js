import vue                   from '@vitejs/plugin-vue';
import {execSync}            from 'child_process';
import * as fs               from 'fs';
import path                  from 'path';
import {fileURLToPath}       from 'url';
import {build, defineConfig} from 'vite';
import dts                   from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const commonConfig = {
	plugins : [
		/*dts({
		 tsConfigFilePath : "./tsconfig.json",
		 insertTypesEntry : true,
		 }),*/
//		vue(),
	],
	resolve : {
		alias : {
			'@idevelopthings/vue-class-stores/vue'       : path.resolve(__dirname, './src/Lib/index.ts'),
			'@idevelopthings/vue-class-stores/dev-tools' : path.resolve(__dirname, './src/DevTools/index.ts'),
			'@idevelopthings/vue-class-stores/vite'      : path.resolve(__dirname, './src/VitePlugin/index.ts'),
		},
	},
	build   : {
		sourcemap     : true,
		rollupOptions : {
			external : [
				'vue',
				'lodash',
				'klona',
				'#ansi-styles',
				"#supports-color",
				"typescript",
				"fs-jetpack",
				'chalk',
				'path',
			],
			output   : {
				globals : {
					vue               : 'Vue',
					lodash            : '_',
					klona             : 'klona',
					'#ansi-styles'    : 'ansi-styles',
					'#supports-color' : "supports-color",
					'typescript'      : "ts",
					'fs-jetpack'      : "jetpack",
					'chalk'           : 'chalk',
					'path'            : 'path',
				},
			},
		},
	},
};

const libConfigs = {
	'DevTools' : {
		outDir : 'dist/DevTools',
		lib    : {
			name     : 'VueClassStoresDevTools',
			entry    : './src/DevTools/index.ts',
			fileName : 'index',
			formats  : ['es', 'cjs', 'umd', 'iife'],
		},
	},
	'Lib'      : {
		outDir : 'dist/Lib',
		lib    : {
			name     : 'VueClassStoresLib',
			entry    : './src/Lib/index.ts',
			fileName : 'index',
			formats  : ['es', 'cjs', 'umd', 'iife'],
		},
	},
	/*	'VitePlugin' : {
	 outDir : 'dist/VitePlugin',
	 lib    : {
	 name     : 'VueClassStoresVitePlugin',
	 entry    : './src/VitePlugin/index.ts',
	 fileName : 'index',
	 formats  : ['es', 'cjs', 'umd', 'iife'],
	 },
	 },*/
	'Common' : {
		outDir : 'dist/Common',
		lib    : {
			name     : 'VueClassStoresCommon',
			entry    : './src/Common/index.ts',
			fileName : 'index',
			formats  : ['es', 'cjs', 'umd', 'iife'],
		},
	},
};

function forLib(key) {
	const config = {...commonConfig};

	config.root         = __dirname;
	config.build.lib    = libConfigs[key].lib;
	config.build.outDir = libConfigs[key].outDir;

	return {
		...defineConfig(config),
		configFile : false,
	};
}

for (let lib in libConfigs) {
	console.log('Building', lib);
	await build(forLib(lib));
	console.log('Done with', lib);
}

execSync(`tsc --declaration --emitDeclarationOnly --project ./tsconfig.lib.json`);
execSync(`tsc --declaration --project ./tsconfig.vite-plugin.json`);
execSync(`cp src/VitePlugin/package.json dist/VitePlugin/package.json`);

fs.writeFileSync('./dist/index.d.ts', `\n
export * from './Lib';
`,
);
fs.writeFileSync('./dist/index.js', `\n
export * from './Lib';
`,
);
