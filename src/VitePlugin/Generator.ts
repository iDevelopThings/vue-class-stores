import jetpack from "fs-jetpack";
import {FSJetpack} from "fs-jetpack/types";
import * as path from "path";
import ts from "typescript";
import crypto from 'crypto';
import {formatVueBindingName} from "../Common";
import {createLazyImportGlobNode, createRelativeImportNode} from "./Builders/Imports";
import {unwrappableNode} from "./Builders/Object";
import {createStoreLoaderModule} from "./Builders/StoreLoader";
import {basicLog, colors, errorLog, infoLog, successLog, warnLog} from "./Logger";
import {FullConfig} from "./types";
import uniq from 'lodash.uniq';

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

	/**
	 * File paths to all files in the project(loaded by typescript compiler)
	 * @type {string[]}
	 */
	public filePaths: string[]                  = [];
	/**
	 * File paths to all of our store files in the project
	 * @type {string[]}
	 */
	public storeFilePaths: string[];
	/**
	 * When we first load our stores, we'll take a hash of the content
	 * Later on this hash will be used when there is a change, mainly to
	 * determine if we need to do some file writes, when writing stores.d.ts,
	 * even if contents are the same, this makes vite do a full page reload...
	 * @type {Map<string, string>}
	 */
	public storeFileHashes: Map<string, string> = new Map();

	/**
	 * All of the store modules in our project
	 *
	 * @type {{module: ts.SourceFile, store: StoreMeta}[]}
	 */
	public modules: { module: ts.SourceFile, store: StoreMeta }[] = [];

	public stores: StoreMeta[] = [];

	public config: Partial<FullConfig>;
	public compilerHost: ts.CompilerHost;
	public printer: ts.Printer;
	public typeChecker: ts.TypeChecker;
	public parsedCommandLine: ts.ParsedCommandLine;

	public static instance: Context;

	/**
	 * This is the directory where all of our generated files will be stored
	 * @type {FSJetpack}
	 * @private
	 */
	public generatedDir: FSJetpack;

	public init(pluginConfig: Partial<FullConfig>) {
		Context.instance = this;

		this.config = pluginConfig;

		const configPath = ts.findConfigFile(pluginConfig.projectRoot, ts.sys.fileExists, "tsconfig.json");
		if (!configPath) {
			throw new Error("Could not find a valid 'tsconfig.json'.");
		}
		this.parsedCommandLine = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, "./");

		this.generatedDir = jetpack.dir(this.config.storesDirectory.path(pluginConfig.generatedDirName));

		this.setFilePaths();

		this.compilerHost = ts.createCompilerHost(this.parsedCommandLine.options);
		this.program      = ts.createProgram(this.filePaths, this.parsedCommandLine.options, this.compilerHost);
		this.printer      = ts.createPrinter({newLine : ts.NewLineKind.LineFeed});
		this.typeChecker  = this.program.getTypeChecker();

		this.reloadModules(false);

		this.loadGeneratedFileHash(pluginConfig.storesFileName);
		this.loadGeneratedFileHash(pluginConfig.storeLoaderFile);
	}

	/**
	 * Set the store file paths & all project file paths
	 *
	 * @returns {string[]}
	 */
	public setFilePaths(): string[] {
		const paths = this.config.storesDirectory.find({
			directories : false,
			files       : true,
			recursive   : true,
			matching    : ['*Store.ts', '*store.ts'],
		}).map(
			filePath => ts.sys.resolvePath(this.config.storesDirectory.path(filePath))
		);

		this.storeFilePaths = paths;

		return this.filePaths = uniq(paths.concat(...this.parsedCommandLine.fileNames.map(
			f => ts.sys.resolvePath(f)
		)));
	}

	/**
	 * Load all of our store modules and create a "store meta" class.
	 */
	public reloadModules(reloadFilePaths: boolean = true) {
		if (reloadFilePaths) {
			this.setFilePaths();
		}

		this.modules = this.program.getSourceFiles()
			.filter(module => this.storeFilePaths.includes(module.fileName))
			.map(module => ({module, store : new StoreMeta(module, this.config.storesPath)}));

		for (let module of this.modules) {
			this.addFileHash(module.module.fileName, module.module.getFullText());
		}
	}

	private addFileHash(filePath: string, content: string) {
		const hash = crypto.createHash('sha256').update(content).digest('hex');

		if (this.storeFileHashes.has(filePath)) {
			const oldHash = this.storeFileHashes.get(filePath);
			if (oldHash === hash) {
				return false;
			}
			this.storeFileHashes.set(filePath, hash);
			warnLog("Store file hash is different: " + filePath);
			return true;
		}

		this.storeFileHashes.set(filePath, hash);

		return true;
	}

	private loadGeneratedFileHash(file: string) {
		if (this.generatedDir.exists(file)) {
			const content = this.generatedDir.read(file);
			this.addFileHash(this.generatedDir.path(file), content);
		}
	}

	/**
	 * MAKE SURE TO PASS A FULL ABSOLUTE PATH TO THIS METHOD!
	 *
	 * @param {string} filePath
	 * @returns {boolean}
	 * @private
	 */
	private fileHasChanged(filePath: string) {
		const fPath = jetpack.path(filePath);
		if (!this.storeFileHashes.has(fPath)) {
			return true;
		}

		const content = jetpack.read(fPath);
		const hash    = crypto.createHash('sha256').update(content).digest('hex');

		return this.storeFileHashes.get(filePath) !== hash;
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
		this.writeStoreDeclaration();
	}

	private writeStoreDeclaration() {
		const storeCount = this.stores?.length;
		if (!storeCount) {
			warnLog('No stores located... skipping code-gen.');
			return;
		}

		infoLog('Located', colors.ResetWrap(storeCount), 'stores:');
		basicLog(this.stores.map(s => "   - " + colors.ResetWrap(s.className)).join('\n'));

		const vueDtsFile = createVueDtsFile(this.stores);

		const {didWrite, filePath} = this.writeTsFile(this.generatedDir.path(this.config.storesFileName), vueDtsFile);
		if (didWrite) {
			successLog(
				'Generated stores vue declaration file at:',
				colors.ResetWrap(this.generatedDir.path(filePath).replace(this.config.projectRoot, ''))
			);
		}

		const loaderResult = this.writeTsFile(
			this.generatedDir.path(this.config.storeLoaderFile),
			createStoreLoaderModule(this.stores)
		);
		if (loaderResult.didWrite) {
			successLog(
				'Generated store loader file at:',
				colors.ResetWrap(this.generatedDir.path(loaderResult.filePath).replace(this.config.projectRoot, ''))
			);
		}

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
							if (ts.isIdentifier(member.name)) {
								const action = new ActionMeta(member, member.name.text);
								actions.push(action);
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

	private writeTsFile(filePath: string, nodes: ts.Node[]) {
		const result = {didWrite : false, filePath : filePath};

		const sourceFile = ts.createSourceFile(filePath, '', this.parsedCommandLine.options.target, false, ts.ScriptKind.TS);
		const source     = this.printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(nodes), sourceFile);

		result.didWrite = this.writeFile(filePath, source);

		return result;
	}

	private writeFile(filePath: string, contents: string) {
		if (!this.addFileHash(filePath, contents)) {
			return false;
		}

		jetpack.write(filePath, contents);
		return true;
	}

	public static printNode(node: any) {
		try {
			const sourceFile = ts.createSourceFile('temp.ts', '', this.instance.parsedCommandLine.options.target, false, ts.ScriptKind.TS);
			infoLog('Printed node > \n' + this.instance.printer.printNode(ts.EmitHint.Unspecified, node, sourceFile));
		} catch (error) {
			errorLog("Failed to print node", error);
		}
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
	 * The relative import path from Stores/.generated/StoreLoader.ts to the store location
	 * @type {string}
	 */
	public loaderImportPath: string;
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
		this.relStoreFilePath = path.relative(Context.instance.generatedDir.path(), file.fileName);

		this.loaderImportPath = this.relStoreFilePath; // path.relative(file.fileName, Context.instance.generatedDir.path(Context.instance.config.storeLoaderFile));
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

		this.vueBinding = formatVueBindingName(this.vueBinding, this.className);
	}

	public metaObject(includeImport: boolean = true) {
		return {
			className  : this.className,
			importPath : this.loaderImportPath,
			exportName : this.exportName,
			vueBinding : this.vueBinding,
			actions    : JSON.parse(JSON.stringify(this.actions)),
			module     : unwrappableNode(createLazyImportGlobNode(this.loaderImportPath))
		};
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
	const storeImports = stores.map(
		store => createRelativeImportNode([store.exportName], store.relStoreFilePath)
	);

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
