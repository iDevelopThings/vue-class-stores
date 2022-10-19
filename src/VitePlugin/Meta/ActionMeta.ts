import ts from "typescript";
import {isLifeCycleEvent, LifeCycleEvent} from "../../Common/LifeCycle";
import {extractDecoratorsFromSignature, extractSignatureMeta, SignatureMetaDecoratorInfo, SignatureMetaParamInfo} from "../AstHelpers/Signature";
import {errorMessages} from "../ErrorMessages";
import {errorLog} from "../Logger";
import {ProcessingContext} from "../Utils/ProcessingContext";

export class ActionMeta {
	/**
	 * The name of the method
	 */
	public name: string;

	/**
	 * The parameters of the method
	 */
	public params: SignatureMetaParamInfo[] = [];

	/**
	 * The decorators defined on the method
	 */
	public decorators: SignatureMetaDecoratorInfo[] = [];

	/**
	 * If we defined a lifecycle decorator on the method, we'll return it here
	 */
	public lifeCycleEventHandler: LifeCycleEvent;

	/**
	 * Typescript AST for the method
	 */
	public readonly method: ts.MethodDeclaration;

	constructor(method: ts.MethodDeclaration) {
		this.method = method;
	}

	prepare() {
		const methodMeta = extractSignatureMeta(this.method);

		this.name   = methodMeta.name;
		this.params = methodMeta.parameters;

		this.decorators = extractDecoratorsFromSignature(this.method, decorator => {
			return isLifeCycleEvent(decorator.expression.getText());
		});

		for (let decorator of this.decorators) {
			this.setDecorator(decorator);
		}
	}

	isValid() {
		// If this action is an event handler, we don't want to store it in the actions list
		// We'll use the store's lifeCycleHandlers instead
		if (this.lifeCycleEventHandler) {
			return false;
		}

		return true;
	}

	toJSON() {
		return {
			name                  : this.name,
			params                : this.params,
			lifeCycleEventHandler : this.lifeCycleEventHandler,
		};
	}

	private setDecorator(decorator: SignatureMetaDecoratorInfo): void {
		if (this.lifeCycleEventHandler) {
			ProcessingContext.linter.error(
				errorMessages.lifecycle.multipleLifeCycleHandlersDefinedForMethod(this.name, this.lifeCycleEventHandler),
				this.method
			);

			return;
		}

		ProcessingContext.store.addLifeCycleHandler(this.method, decorator.name as LifeCycleEvent);

		this.lifeCycleEventHandler = decorator.name as LifeCycleEvent;
	}

	public toMetaObject() {
		return {
			n : this.name,
			p : this.params.map(p => ({n : p.name, t : p.type, dv : p.defaultValue})),
			d : this.decorators.map(d => ({n : d.name, p : d.parameters})),
			h : this.lifeCycleEventHandler,
		};
	}
}
