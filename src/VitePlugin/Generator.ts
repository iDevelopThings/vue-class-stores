import chalk from "chalk";
import _ from "lodash";
import * as path from "path";
import ts from "typescript";
import {formatVueBindingName} from "../Common/Formatting";
import {basicLog, infoLog, successLog, warnLog} from "./Logger";
import {FullConfig} from "./types";

const {factory} = ts;

export type StoreInfo = {
	filePath?: string;
	name?: string;
	/**
	 * The name of the class that extends Store
	 */
	className?: string,
	/**
	 * If the dev defined `public static vueBinding = 'x';` in their store, this will hold that value
	 */
	vueBinding?: string,
	/**
	 * This will hold the name of our store export `export const store = new MyStore();`
	 */
	exportName?: string,
}


export class Context {

	public program: ts.Program;
	public filePaths: string[] = [];

	public modules: { module: ts.SourceFile, store: StoreMeta }[] = [];

	public stores: StoreMeta[] = [];

	public config: FullConfig;
	public compilerHost: ts.CompilerHost;
	public printer: ts.Printer;
	public typeChecker: ts.TypeChecker;

	public static instance: Context;
	private parsedCommandLine: ts.ParsedCommandLine;

	public init(pluginConfig: FullConfig) {
		Context.instance = this;

		this.config = pluginConfig;

		const configPath = ts.findConfigFile(pluginConfig.projectRoot, ts.sys.fileExists, "tsconfig.json");
		if (!configPath) {
			throw new Error("Could not find a valid 'tsconfig.json'.");
		}
		const configFile       = ts.readConfigFile(configPath, ts.sys.readFile);
		this.parsedCommandLine = ts.parseJsonConfigFileContent(
			configFile.config,
			ts.sys,
			"./"
		);

		this.setFilePaths();

		this.compilerHost = ts.createCompilerHost(this.parsedCommandLine.options);
		this.program      = ts.createProgram(this.filePaths, this.parsedCommandLine.options, this.compilerHost);
		this.printer      = ts.createPrinter({newLine : ts.NewLineKind.LineFeed});
		this.typeChecker  = this.program.getTypeChecker();

		this.reloadModules();
	}

	public setFilePaths(): string[] {
		const paths = this.config.storesDirectory.find({
			directories : false,
			files       : true,
			recursive   : true,
			matching    : ['*Store.ts', '*store.ts'],
		}).map(
			filePath => ts.sys.resolvePath(this.config.storesDirectory.path(filePath))
		);

		return this.filePaths = _.uniq(paths.concat(...this.parsedCommandLine.fileNames.map(
			f => ts.sys.resolvePath(f)
		)));
	}

	public reloadModules() {
		this.setFilePaths();

		this.modules = this.program.getSourceFiles()
			.filter(module => this.filePaths.includes(module.fileName))
			.map(module => {
				return {
					module,
					store : new StoreMeta(module, this.config.storesPath)
				};
			});
	}

	process() {
		this.stores = [];
		for (const {module, store} of this.modules) {
			const outStore = this.processModule(module, store);
			if (!outStore) continue;

			this.stores.push(outStore.finalize());
		}
	}

	writeFiles() {
		const storeCount = this.stores?.length;
		if (!storeCount) {
			warnLog('No stores located... skipping code-gen.');
			return;
		}


		infoLog('Located', chalk.reset(storeCount), 'stores:');
		basicLog(this.stores.map(s => "   - " + chalk.reset(s.className)).join('\n'));


		const vueDtsFile   = createVueDtsFile(this.stores);
		const storesSource = ts.createSourceFile(this.config.storesFileName, '', ts.ScriptTarget.ES2022, false, ts.ScriptKind.TS);
		const storesDtsTs  = this.printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(vueDtsFile), storesSource);
		this.config.storesDirectory.write(this.config.storesFileName, storesDtsTs);

		this.config.storesDirectory.write(
			'StoreMeta.json',
			JSON.stringify(this.stores, null, 2)
		);

		successLog(
			'Generated stores vue declaration file at:',
			chalk.reset(path.join(this.config.storesPath, this.config.storesFileName).replace(this.config.projectRoot, ''))
		);
	}

	rebuild() {
		this.process();
		this.writeFiles();
	}

	private processModule(module: ts.SourceFile, store: StoreMeta): StoreMeta | undefined {
		for (let statement of module.statements) {

			// Search for our `export myStoreName = new MyStore();` statement and extract `myStoreName`
			if (ts.isVariableStatement(statement)) {
				if (statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) && statement?.declarationList?.declarations?.length === 1) {
					const declaration = statement.declarationList.declarations[0];
					if (ts.isIdentifier(declaration.name)) {
						store.exportName = declaration.name.text;
					}
				}
			}

			// Search for our `export class MyStore extends Store<MyStore, IMyStoreState> {` statement and extract `MyStore`
			if (ts.isClassDeclaration(statement)) {
				// Ensure our class extends Store
				const extendsStore = statement.heritageClauses?.some(h => {
					if (h.token !== ts.SyntaxKind.ExtendsKeyword)
						return false;

					return h.types.some(t => {
						if (!ts.isExpressionWithTypeArguments(t)) return false;
						if (!ts.isCallExpression(t.expression)) return false;

						const callExpression = t.expression;
						if (!ts.isIdentifier(callExpression.expression)) return false;

						return callExpression.expression.text?.toLowerCase() === "store";
					});
				});

				if (extendsStore && ts.isIdentifier(statement.name)) {
					store.className = statement.name.text;

					// Now we have to look for the `public static vueBinding = 'x';` statement and pull out it's value.
					for (let member of statement.members) {
						if (ts.isPropertyDeclaration(member)) {
							if (!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)) continue;

							if (ts.isIdentifier(member.name) && member.name.text === "vueBinding") {
								if (ts.isStringLiteral(member.initializer)) {
									store.vueBinding = member.initializer.text;
									break;
								}
							}
						}
					}

					const actions = [];

					for (let member of statement.members) {
						if (ts.isMethodDeclaration(member)) {
							//							if (!member.modifiers?.some(m => m.kind === ts.SyntaxKind.PublicKeyword)) continue;

							if (ts.isIdentifier(member.name)) {
								const action = new ActionMeta(member, member.name.text);
								actions.push(action);

								for (let param of member.parameters) {
									if (ts.isIdentifier(param.name)) {
										action.addParam(param);
									}
								}
							}
						}
					}

					store.actions = actions;
				}
			}

		}

		return store.isValid() ? store : undefined;
	}

	public isStoreFile(path: string): boolean {
		return this.stores.some(s => s.absFilePath === path);
	}

	public getStoreByFilePath(path: string): StoreMeta | undefined {
		return this.stores.find(s => s.absFilePath === path);
	}
}


export class StoreMeta {
	/**
	 * The absolute path to the store file
	 */
	public absFilePath: string;
	/**
	 * The relative path of the store file, for ex, if importing in /src/stores/, and our file is at /src/stores/MyStore.ts, this will be MyStore.ts
	 */
	public relStoreFilePath: string;
	/**
	 * The name of the store file
	 */
	public name: string;
	/**
	 * The name of the class that extends Store
	 */
	public className?: string;
	/**
	 * This will hold the name of our store export `export const store = new MyStore();`
	 */
	public exportName?: string;
	/**
	 * If the dev defined `public static vueBinding = 'x';` in their store, this will hold that value
	 */
	public vueBinding?: string;

	public actions: ActionMeta[] = [];


	constructor(file: ts.SourceFile, absStoresPath: string) {
		this.absFilePath      = file.fileName;
		this.name             = path.basename(file.fileName);
		this.relStoreFilePath = path.relative(absStoresPath, file.fileName);
	}

	public isValid() {
		return this.className !== undefined && this.exportName !== undefined;
	}

	public finalize(): this {
		this.formatVueBinding();

		return this;
	}

	private formatVueBinding(): void {
		if (this.vueBinding) {
			return;
		}

		/*let value = this.className;

		 if (value.endsWith('Store')) {
		 value = value.replace('Store', '');
		 value = value.charAt(0).toLowerCase() + value.slice(1);
		 }
		 */
		this.vueBinding = formatVueBindingName(this.vueBinding, this.className);
	}
}

class ActionMeta {

	public name: string;
	public params = [];
	private method: ts.MethodDeclaration;
	private signature: ts.Signature;

	constructor(method: ts.MethodDeclaration, name: string) {
		this.method = method;
		this.name   = name;

		this.signature = Context.instance.typeChecker.getSignatureFromDeclaration(this.method);

		for (let parameter of this.signature.parameters) {
			const ptype = Context.instance.typeChecker.typeToString(Context.instance.typeChecker.getTypeAtLocation(parameter.valueDeclaration));

			let defaultValue = undefined;
			if (ts.isParameter(parameter.valueDeclaration)) {
				if (parameter.valueDeclaration.initializer) {
					defaultValue = parameter.valueDeclaration.initializer.getText();
				}
			}

			this.params.push({
				name : parameter.name,
				type : ptype,
				defaultValue,
			});
		}
	}

	addParam(param: ts.ParameterDeclaration) {
		//		const type = Context.instance.typeChecker.getSignatureFromDeclaration(this.method);


		//		this.params.push({
		//			name : (param.name as any).text,
		//			type : param.type?.getText()
		//		});
	}

	toJSON() {
		return {
			name   : this.name,
			params : this.params
		};
	}

}

function createVueDtsFile(stores: StoreMeta[]): ts.Node[] {
	/**
	 * This code will generate the following:
	 *
	 * declare module "@vue/runtime-core" {
	 *   import {storeExportName} from "./StoreName";
	 * 	 interface ComponentCustomProperties {
	 * 		$storeVueBinding: typeof storeExportName;
	 * 	 }
	 * }
	 *
	 * export {};
	 */

	/**
	 * This will generate:
	 * $storeVueBinding: typeof storeExportName;
	 */
	const componentProperties = stores.map(store => factory.createPropertySignature(
		undefined,
		factory.createIdentifier(store.vueBinding),
		undefined,
		factory.createTypeQueryNode(factory.createIdentifier(store.exportName), undefined)
	));

	/**
	 * This will generate our imports:
	 * import {storeExportName} from "./StoreName";
	 */
	const storeImports = stores.map(store => factory.createImportDeclaration(
		undefined,
		factory.createImportClause(
			false,
			undefined,
			factory.createNamedImports([
				factory.createImportSpecifier(false, undefined, factory.createIdentifier(store.exportName))
			])
		),
		factory.createStringLiteral(`./${store.relStoreFilePath.replace('.ts', '')}`),
		undefined
	));

	/**
	 * This will generate the main declare module/interface block
	 */
	const declareModuleBlock = factory.createModuleDeclaration(
		[factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
		factory.createStringLiteral("@vue/runtime-core"),
		factory.createModuleBlock([
			...storeImports,
			factory.createInterfaceDeclaration(
				undefined,
				factory.createIdentifier("ComponentCustomProperties"),
				undefined,
				undefined,
				componentProperties
			)
		]),
		ts.NodeFlags.ExportContext /*| ts.NodeFlags.Ambient*/ | ts.NodeFlags.ContextFlags
	);


	//	const imports = stores.map(store => `\timport {${store.exportName}} from './${store.relStoreFilePath.replace('.ts', '')}';`).join('\n');

	//	let contents = [
	//		`declare module "@vue/runtime-core" {`,
	//		imports,
	//		`\tinterface ComponentCustomProperties {`,
	//		stores.map(store => `\t\t${store.vueBinding}: typeof ${store.exportName};`).join('\n'),
	//		`\t}`,
	//		`}`,
	//		`export {}`
	//	];

	//	return contents.join('\n');


	return [
		declareModuleBlock,
		factory.createExportDeclaration(
			undefined,
			false,
			factory.createNamedExports([]),
			undefined,
			undefined
		),
	];
}
