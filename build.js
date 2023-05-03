import vue                     from '@vitejs/plugin-vue';
import { execSync }            from 'child_process';
import * as fs                 from 'fs';
import path                    from 'path';
import { fileURLToPath }       from 'url';
import { build, defineConfig } from 'vite';


const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * @type {import('vite').UserConfig}
 */
const commonConfig = {
	plugins : [
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
		sourcemap     : true,
		rollupOptions : {
			external : [
				'vue',
				'klona',
				"typescript",
				"fs-jetpack",
				'path',
				'@vue/devtools-api',
				'@vue/compat',
				'@vue/compiler-dom',
				'@vue/compiler-sfc',
				'@vue/runtime-core',
			],
			output   : {
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

function forLib(key)
{
	const config = {...commonConfig};
	
	if (config.plugins?.length) {
		config.plugins = config.plugins.concat(libConfigs[key].plugins ?? []);
	}
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

execSync(`yarn run tsc:types:lib`, {stdio : 'inherit'});
execSync(`yarn run tsc:types:vite-pkg`, {stdio : 'inherit'});
if (process.platform === 'win32') {
	execSync(`copy ".\\src\\VitePlugin\\package.json" ".\\dist\\VitePlugin\\package.json"`, {stdio : 'inherit'});
} else {
	execSync(`cp src/VitePlugin/package.json dist/VitePlugin/package.json`, {stdio : 'inherit'});
}

fs.writeFileSync('./dist/index.d.ts', `\n
export * from './Lib';
`,
);
fs.writeFileSync('./dist/index.js', `\n
export * from './Lib';
`,
);
