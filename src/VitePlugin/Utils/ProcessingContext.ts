import ts from 'typescript';
import {errorMessages} from "../ErrorMessages";
import {Linter, Linting} from "../Linting";
import {ActionMeta} from "../Meta/ActionMeta";
import {StoreMeta} from "../Meta/StoreMeta";

export class ProcessingContextInstance {
	public linter: Linter;

	/**
	 * The module that's currently being processed
	 */
	public module: ts.SourceFile;

	/**
	 * The store that we're currently processing
	 */
	public store: StoreMeta;

	/**
	 * The class that's currently being processed
	 */
	public classDeclaration: ts.ClassDeclaration;

	/**
	 * The method that is currently being processed, if we're processing one.
	 */
	public methodDeclaration: ts.MethodDeclaration;
	public action: ActionMeta;


	setCurrent(module: ts.SourceFile, store: StoreMeta) {
		this.classDeclaration = undefined;
		this.module           = module;
		this.store            = store;
		this.linter           = Linting.factory(module);
	}

	public validate(): void {
		if (this.classDeclaration) {
			if (!this.store.exportName) {
				this.linter.error(errorMessages.store.missingExport(this.store.className), this.classDeclaration);
			}

			if (!this.store.stateObj) {
				this.linter.error(errorMessages.stateGetter.missingStateGetter(this.store.className), this.classDeclaration);
			}
		}

		this.linter.merge();
	}

	public processingStoreClass(classDeclaration: ts.ClassDeclaration, handlerFunc: () => void): void {
		this.classDeclaration = classDeclaration;
		handlerFunc();
		this.classDeclaration = undefined;
	}

	/**
	 * We use a callback here so that we can temporarily set the method
	 * on the context, and remove it again once we're done
	 */
	public processingAction(action: ActionMeta, handlerFunc: () => void): void {
		this.methodDeclaration = action.method;
		this.action            = action;
		handlerFunc();
		this.methodDeclaration = undefined;
		this.action            = undefined;
	}
}

export const ProcessingContext = new ProcessingContextInstance();
