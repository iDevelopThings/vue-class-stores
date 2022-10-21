import path from "path";
import ts from "typescript";
import {formatVueBindingName} from "../../Common";
import {LifeCycleEvent} from "../../Common/LifeCycle";
import {isStateGetterNode, isVueBinding} from "../AstHelpers/Classes";
import {hasDecorator} from "../AstHelpers/Modifiers";
import {createLazyImportGlobNode} from "../Builders/Imports";
import {createNodeFromValue, newClassInstance, UnwrappableNode, unwrappableNode} from "../Builders/Object";
import {errorMessages} from "../ErrorMessages";
import {errorLog} from "../Logger";
import {PluginConfig} from "../PluginConfig";
import {ProcessingContext} from "../Utils/ProcessingContext";
import {ActionMeta} from "./ActionMeta";


export type GetterSetterInfo = { n: string, c: boolean };
export type GetterSetterList = { [key: string]: GetterSetterInfo };

export type MetaObjectGetterSetterList = { [key: string]: UnwrappableNode };

export type StoreMetaObject = {
	store?: {
		className: string,
		exportName: string,
		vueBinding: string,
		module: UnwrappableNode,
	}
	actions?: { [key: string]: UnwrappableNode },
	lifeCycleHandlers?: { [key: string]: LifeCycleEvent },
	stateKeys?: string[],
	getters?: MetaObjectGetterSetterList,
	setters?: MetaObjectGetterSetterList,
};

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

	/**
	 * The actions which have been defined on this store
	 */
	public actions: { [key: string]: ActionMeta } = {};

	/**
	 * Method name -> event type
	 */
	public lifeCycleHandlers: { [key: string]: LifeCycleEvent } = {};

	/**
	 * The keys that were defined in our `get state() { return {...} }` getter
	 * This will only hold root level key names
	 */
	public stateKeys: string[] = [];

	/**
	 * Holds the name and whether our getter is a computed property, for all js getters defined on the store
	 */
	public getters: GetterSetterList = {};

	/**
	 * Holds the name and whether our setter is a computed property, for all js setters defined on the store
	 */
	public setters: GetterSetterList = {};

	/**
	 * The AST of our state getter object, this is mainly used to do some checks/validation later in the processing
	 */
	public stateObj: ts.ObjectLiteralExpression;

	public metaObject: StoreMetaObject = {
		actions           : {},
		lifeCycleHandlers : {},
		stateKeys         : [],
		getters           : {},
		setters           : {},
	};

	constructor(file: ts.SourceFile) {
		this.absFilePath      = file.fileName;
		this.name             = path.basename(file.fileName);
		this.relStoreFilePath = path.relative(PluginConfig.generatedDir.path(), file.fileName);
		this.loaderImportPath = this.relStoreFilePath;
	}

	/**
	 * Ensure that we have everything we need to process this as a store and register it with the loader
	 */
	public isValid() {
		return this.className !== undefined && this.exportName !== undefined;
	}

	/**
	 * Apply any final modifications we need to do before outputting the store
	 */
	public finalize(): this {
		this.formatVueBinding();

		// debugLog(`Found getters: ${this.getters?.map(g => g.n).join(', ')} in ${this.className}`);

		return this;
	}

	/**
	 * Ensure that we actually have a vue binding specified
	 *
	 * Either use that static vue binding property defined on the store class
	 * Or fallback to creating one from the class name of the store
	 */
	private formatVueBinding(): void {
		if (this.vueBinding) {
			if (!this.vueBinding.startsWith('$')) {
				this.vueBinding = '$' + this.vueBinding;
			}
			return;
		}

		this.vueBinding = formatVueBindingName(undefined, this.className);
	}

	/**
	 * Set the state object and extract all keys from the object
	 */
	public setStateObject(stateObj: ts.ObjectLiteralExpression): void {
		this.stateObj = stateObj;

		for (let property of stateObj.properties) {
			if (ts.isPropertyAssignment(property) && property?.name) {
				this.stateKeys.push((property.name as any)?.escapedText);
			}
		}

		this.metaObject.stateKeys = this.stateKeys;

		// debugLog(`Found state keys ${this.stateKeys.join(", ")} in ${this.className}`);
	}

	/**
	 * Add an action definition to our store
	 */
	public addAction(action: ActionMeta): void {
		action.prepare();
		if (!action.isValid()) {
			return;
		}

		this.actions[action.name] = action;

		this.metaObject.actions[action.name] = unwrappableNode(newClassInstance(
			"StoreMetaActionData",
			[createNodeFromValue(this.actions[action.name].toMetaObject())],
		));
	}

	/**
	 * Add a getter definition to our store
	 */
	public addGetter(member: ts.GetAccessorDeclaration): void {
		if (member.name.getText() === 'state') {
			return;
		}

		const getter: GetterSetterInfo = {
			n : member.name.getText(),
			c : hasDecorator(member, 'Computed'),
		};

		this.getters[getter.n] = getter;

		this.metaObject.getters[getter.n] = unwrappableNode(newClassInstance(
			"StoreMetaGetterSetterData",
			[createNodeFromValue("getter"), createNodeFromValue(getter)],
		));
	}

	/**
	 * Add a setter definition to our store
	 *
	 * We also need to check if this setter has a corresponding getter
	 * If it does, and it has the @Computed decorator, we need to mark this setter as
	 * computed also, this will allow the vue lib to create a writable computed property
	 */
	public addSetter(member: ts.SetAccessorDeclaration): void {
		const getterSymbol = (member as any)?.symbol as ts.Symbol;
		if (!getterSymbol) {
			errorLog(`Could not find symbol for setter ${member.name.getText()} in ${this.className}. Please create an issue on the plugin's github`);
			return;
		}

		const declarations = getterSymbol.declarations;
		if (!declarations) {
			errorLog(`Could not find declarations for setter ${member.name.getText()} in ${this.className}. Please create an issue on the plugin's github`);
			return;
		}

		const setterInfo: GetterSetterInfo = {
			n : member.name.getText(),
			c : false,
		};

		const getter = declarations.find(d => ts.isGetAccessorDeclaration(d));
		// We can only make it a computed property if there is a corresponding getter
		if (getter) {
			setterInfo.c = hasDecorator(getter, 'Computed');
		}

		this.setters[setterInfo.n] = setterInfo;

		this.metaObject.setters[setterInfo.n] = unwrappableNode(newClassInstance(
			"StoreMetaGetterSetterData",
			[createNodeFromValue("setter"), createNodeFromValue(setterInfo)],
		));
	}

	/**
	 * Store that X method name handles x lifecycle event
	 */
	public addLifeCycleHandler(method: ts.MethodDeclaration, lifeCycleEvent: LifeCycleEvent): void {
		if (Object.values(this.lifeCycleHandlers).includes(lifeCycleEvent)) {
			ProcessingContext.linter.error(
				errorMessages.lifecycle.multipleLifeCycleHandlersDefinedForEvent(ProcessingContext.action.name),
				method
			);
			return;
		}

		this.lifeCycleHandlers[method.name.getText()] = lifeCycleEvent;

		this.metaObject.lifeCycleHandlers = this.lifeCycleHandlers;
	}

	process(declaration:ts.ClassDeclaration) {
		// Store the class name for our store
		this.className = declaration.name.text;

		// Now we'll process the members of the class
		// We need to extract Action meta & the vue binding(if one is defined)
		for (let member of declaration.members) {

			// Now we have to look for the `public static vueBinding = 'x';`
			// statement and pull out it's value.
			const [isBinding, vueBinding] = isVueBinding(member);
			if (isBinding) {
				this.vueBinding = vueBinding;
				continue;
			}

			// Check if our member is an action, if it is we'll store some meta for it
			if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
				const action = new ActionMeta(member as ts.MethodDeclaration);
				ProcessingContext.processingAction(action, () => {
					this.addAction(action);
				});

				continue;
			}

			const [isStateGetter, stateObj] = isStateGetterNode(member);
			if (isStateGetter && !this.stateObj) {
				this.setStateObject(stateObj);

				continue;
			}

			if (ts.isGetAccessor(member) && ts.isIdentifier(member.name)) {
				this.addGetter(member);
				continue;
			}

			if (ts.isSetAccessor(member) && ts.isIdentifier(member.name)) {
				this.addSetter(member);
			}

		}
	}

	/**
	 * Create the meta object which will be stored in the generated StoreLoader.ts file
	 */
	public toMetaObject() {
		this.metaObject.store = {
			className  : this.className,
			exportName : this.exportName,
			vueBinding : this.vueBinding,
			module     : unwrappableNode(createLazyImportGlobNode(this.loaderImportPath))
		};


		return this.metaObject;
	}


}
