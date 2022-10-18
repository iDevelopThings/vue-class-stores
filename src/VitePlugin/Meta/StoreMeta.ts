import path from "path";
import ts from "typescript";
import {formatVueBindingName} from "../../Common";
import {hasDecorator} from "../AstHelpers/Modifiers";
import {createLazyImportGlobNode} from "../Builders/Imports";
import {unwrappableNode} from "../Builders/Object";
import {debugLog, infoLog} from "../Logger";
import {PluginConfig} from "../PluginConfig";
import {ActionMeta} from "./ActionMeta";

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

	public stateKeys: string[]                  = [];
	public getters: { n: string, c: boolean }[] = [];

	public stateObj: ts.ObjectLiteralExpression;

	constructor(file: ts.SourceFile) {
		this.absFilePath      = file.fileName;
		this.name             = path.basename(file.fileName);
		this.relStoreFilePath = path.relative(PluginConfig.generatedDir.path(), file.fileName);
		this.loaderImportPath = this.relStoreFilePath;
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
			stateKeys  : this.stateKeys,
			getters    : this.getters,
			actions    : JSON.parse(JSON.stringify(this.actions)),
			module     : unwrappableNode(createLazyImportGlobNode(this.loaderImportPath))
		};
	}

	public setStateObject(stateObj: ts.ObjectLiteralExpression): void {
		this.stateObj = stateObj;

		for (let property of stateObj.properties) {
			if (ts.isPropertyAssignment(property)) {
				this.stateKeys.push(property.name.getText());
			}
		}

		debugLog(`Found state keys ${this.stateKeys.join(", ")} in ${this.className}`);
	}

	public addGetter(member: ts.GetAccessorDeclaration): void {
		if (member.name.getText() === 'state') {
			return;
		}

		this.getters.push({
			n : member.name.getText(),
			c : hasDecorator(member, 'Computed'),
		});

		debugLog(`Found getter ${member.name.getText()} in ${this.className}`);
	}

}