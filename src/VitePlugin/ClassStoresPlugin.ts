import * as fs from "fs";
import path from "path";
import type {Plugin, ViteDevServer} from "vite";
import {PluginConfig, UserPluginConfig} from "./PluginConfig";
import {Timed} from "./Utils/Timed";
import {MagicString, relativeify, walk} from "./Utils/ViteFunction";
import {Context} from "./Generator";
import {infoLog} from "./Logger";
import type {AcornNode as AcornNode2} from 'rollup';

export type AcornNode<T = any> = AcornNode2 & Record<string, T>


export function ClassStoresPlugin(configuration?: UserPluginConfig): Plugin {
	PluginConfig.setUserConfig(configuration);
	const context = new Context();

	let server: ViteDevServer;


	return {
		name : 'class-stores-loader',

		configResolved(config) {
			PluginConfig.init(config);

			context.init();
			context.process();
		},

		configureServer(devServer) {
			server = devServer;
			server.watcher.on('all', (eventName: 'add' | 'change' | 'unlink', filePath: string, stats?: fs.Stats) => {
				if (!['add', 'change', 'unlink'].includes(eventName)) {
					return;
				}

				if (PluginConfig.isGeneratedFile(filePath)) {
					return;
				}
				if (!filePath.startsWith(PluginConfig.storesPath)) {
					return;
				}

				context.reloadModules();

				if (['change', 'unlink'].includes(eventName)) {
					const store = context.getStoreByFilePath(filePath);
					if (!store) {
						return;
					}

					eventName === 'unlink'
						? infoLog(`Store file deletion detected: ${store.className}`)
						: infoLog(`Store file change detected: ${store.className}`);

					infoLog(`Rebuilding stores...`);
					context.rebuild();

					return;
				}


				let store = context.getStoreByFilePath(filePath);
				if (!store) {
					infoLog(`New file detected: ${filePath}`);
					infoLog(`Rebuilding store meta...`);
					context.process();
				}
				// Just to ensure it was actually a new store, not a random file
				store = context.getStoreByFilePath(filePath);
				if (store) {
					infoLog(`Addition was a new store: ${store.className}`);
					infoLog(`Rebuilding stores...`);
					context.rebuild();
				}

			});
		},

		async transform(code, id) {
			if (/node_modules\/(?!\.vite\/)/.test(id)) return;
			if (!id.endsWith('.ts')) return;

			const ast = this.parse(code);
			const ms  = new MagicString(code);

			await walk(ast, {
				CallExpression(node: AcornNode) {
					if (node.callee?.type !== 'MemberExpression') return;

					/**
					 * Transform app.use(StoreManager.boot()) to
					 * app.use(StoreManager.boot(import.meta.glob('./Stores/Generated/StoreLoader.ts', {eager:true})))
					 */

					const expression = node.callee;
					if (expression.object?.type !== 'Identifier') return;
					if (expression.object?.name !== 'StoreManager') return;
					if (expression.property?.type !== 'Identifier') return;
					if (expression.property?.name !== 'boot') return;
					if (!!node?.arguments?.length) return;

					const statementCode    = code.slice(node.start, node.end);
					const loaderImportPath = relativeify(path.relative(path.dirname(id), PluginConfig.storesDirectory.path(
						PluginConfig.generatedDirName,
						PluginConfig.storeLoaderFile
					)));

					const newStatement = `StoreManager.boot(import.meta.glob('${loaderImportPath}', {eager:true}))`;

					infoLog(`Transformed boot call from "${statementCode}" to "${newStatement}"`);

					ms.overwrite(node.start, node.end, newStatement);
				}
			});

			const msResult = ms.toString();
			if (msResult === code) return;

			return msResult;
		},

		buildStart(options: any) {
			context.writeFiles();
		},
	};
}

export default ClassStoresPlugin;
