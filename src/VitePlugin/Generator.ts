import jetpack from "fs-jetpack";
import ts from "typescript";
import crypto from 'crypto';
import {extendsStore, isVueBinding} from "./AstHelpers/Classes";
import {isExportConst} from "./AstHelpers/Exports";
import {createStoreLoaderModule} from "./Builders/StoreLoader";
import {createVueDtsFile} from "./Builders/VueDtsFile";
import {basicLog, colors, errorLog, infoLog, successLog, warnLog} from "./Logger";
import {ActionMeta} from "./Meta/ActionMeta";
import {StoreMeta} from "./Meta/StoreMeta";
import {PluginConfig} from "./PluginConfig";
import {TS} from "./TS";
import {Timed} from "./Utils/Timed";

const {factory} = ts;

export class Context {

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

	/**
	 * All of our store meta classes which hold information on all our stores.
	 *
	 * @type {StoreMeta[]}
	 */
	public stores: StoreMeta[] = [];

	public init() {
		Timed.start('generator.init');

		PluginConfig.setStoreFilePaths();
		TS.setup();

		this.reloadModules(false);

		this.loadGeneratedFileHash(PluginConfig.storesFileName);
		this.loadGeneratedFileHash(PluginConfig.storeLoaderFile);

		Timed.end('generator.init');
	}

	/**
	 * Load all of our store modules and create a "store meta" class.
	 */
	public reloadModules(reloadFilePaths: boolean = true) {
		if (reloadFilePaths) {
			PluginConfig.setStoreFilePaths();
		}

		this.modules = TS.program.getSourceFiles()
			.reduce((acc, source) => {
				if (!PluginConfig.storeFilePaths.includes(source.fileName)) {
					return acc;
				}

				acc.push({
					module : source,
					store  : new StoreMeta(source),
				});

				this.addFileHash(source.fileName, source.getFullText());

				return acc;
			}, []);
	}

	/**
	 * Create a file hash for the specified file path + content
	 *
	 * This will be used to prevent over-writing to the FS when the content is the same
	 *
	 * @param {string} filePath
	 * @param {string} content
	 * @returns {boolean}
	 * @private
	 */
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

	/**
	 * Quick helper method to setup file hashes for generated files
	 *
	 * @param {string} file
	 * @private
	 */
	private loadGeneratedFileHash(file: string) {
		if (PluginConfig.generatedDir.exists(file)) {
			const content = PluginConfig.generatedDir.read(file);
			this.addFileHash(PluginConfig.generatedDir.path(file), content);
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

		const {didWrite, filePath} = this.writeTsFile(PluginConfig.vueDtsPath, vueDtsFile);
		if (didWrite) {
			successLog(
				'Generated stores vue declaration file at:',
				colors.ResetWrap(PluginConfig.generatedDir.path(filePath).replace(PluginConfig.projectRoot, ''))
			);
		}

		const loaderResult = this.writeTsFile(
			PluginConfig.generatedDir.path(PluginConfig.storeLoaderFile),
			createStoreLoaderModule(this.stores)
		);
		if (loaderResult.didWrite) {
			successLog(
				'Generated store loader file at:',
				colors.ResetWrap(PluginConfig.generatedDir.path(loaderResult.filePath).replace(PluginConfig.projectRoot, ''))
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
			const [isExport, storeName] = isExportConst(statement);
			if (isExport) {
				store.exportName = storeName;
			}

			// Search for our `export class MyStore extends Store<MyStore, IMyStoreState> {` statement and extract `MyStore`
			if (!ts.isClassDeclaration(statement)) continue;

			// Ensure our class extends Store
			if (!extendsStore(statement)) continue;
			if (!ts.isIdentifier(statement.name)) continue;

			// Store the class name for our store
			store.className = statement.name.text;

			// Now we'll process the members of the class
			// We need to extract Action meta & the vue binding(if one is defined)
			for (let member of statement.members) {
				// Now we have to look for the `public static vueBinding = 'x';`
				// statement and pull out it's value.
				const [isBinding, vueBinding] = isVueBinding(member);
				if (isBinding) {
					store.vueBinding = vueBinding;
				}

				// Check if our member is an action, if it is we'll store some meta for it
				if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
					store.actions.push(new ActionMeta(member, member.name.text));
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

		const sourceFile = ts.createSourceFile(filePath, '', PluginConfig.tsConfig.options.target, false, ts.ScriptKind.TS);
		const source     = TS.printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(nodes), sourceFile);

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
			const sourceFile = ts.createSourceFile('temp.ts', '', PluginConfig.tsConfig.options.target, false, ts.ScriptKind.TS);
			infoLog('Printed node > \n' + TS.printer.printNode(ts.EmitHint.Unspecified, node, sourceFile));
		} catch (error) {
			errorLog("Failed to print node", error);
		}
	}
}


