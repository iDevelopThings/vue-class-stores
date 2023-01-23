import typescript from "@rollup/plugin-typescript";
import * as fs from "fs";
import path from "path";
import type {Plugin, ViteDevServer} from "vite";
import {formatImportString} from "./Builders/Imports";
import {PluginConfig, UserPluginConfig} from "./PluginConfig";
import TransformerFactory, {isTestingEnv} from "./Transformer";
import {MagicString, walk} from "./Utils/ViteFunction";
import {Context} from "./Generator";
import {infoLog} from "./Logger";
import type {AcornNode as AcornNode2} from 'rollup';

export type AcornNode<T = any> = AcornNode2 & Record<string, T>

const context = new Context();

export function ClassStoresPlugin(configuration?: UserPluginConfig): Plugin {
	PluginConfig.setUserConfig(configuration);

	let server: ViteDevServer;

	const plugin = {
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

			let transformed = false;

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
					const loaderImportPath = PluginConfig.getRelativeLoaderImportPath(id);

					transformed = true;

					const newStatement = `StoreManager.boot(import.meta.glob('${loaderImportPath}', {eager:true}))`;

					infoLog(`Transformed boot call from "${statementCode}" to "${newStatement}"`);

					ms.overwrite(node.start, node.end, newStatement);
				}
			});

			if (transformed) {
//				const dir          = path.dirname(id);
//				const storeImports = context.stores.map(
//					store => `'${formatImportString(path.relative(dir, store.absFilePath))}.ts'`
//				);

				const loaderImport = PluginConfig.getRelativeLoaderImportPath(id);

				ms.append(`
				if(import.meta.hot) {
					let ___loaderModule = null;
					import.meta.hot.accept('${loaderImport}', (dep) => {
						if(dep) {
							___loaderModule = dep;
						}
                        StoreManager.loaderReloaded(___loaderModule?.stores);
					})
				}`);
			}

			const msResult = ms.toString();
			if (msResult === code) return;


			return msResult;
		},

		buildStart(options: any) {
			context.writeFiles();
		},
	};

	if (isTestingEnv()) {
		return [
			plugin,
			typescript({
				transformers : {
					before : [
						{
							type    : 'program',
							factory : (program) => TransformerFactory(program),
						},
					],
				},
			})
		] as any;
	}

	return plugin;
}

export default ClassStoresPlugin;
