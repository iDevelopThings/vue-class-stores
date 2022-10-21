import ts from "typescript";
import {isLifeCycleEvent, LifeCycleEvent} from "../../Common/LifeCycle";
import {extractDecoratorsFromSignature, extractSignatureMeta, SignatureMetaDecoratorInfo, SignatureMetaParamInfo} from "../AstHelpers/Signature";
import {errorMessages} from "../ErrorMessages";
import {errorLog} from "../Logger";
import {ProcessingContext} from "../Utils/ProcessingContext";

export type DecoratorMetaInfo = {
	n: string;
	p: { n: string, v: string }[]
}
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
	public decorators: { [key: string]: SignatureMetaDecoratorInfo }    = {};
	public decoratorMeta: { [key: string]: DecoratorMetaInfo } = {};

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

		const decorators = extractDecoratorsFromSignature(this.method, (decorator, info) => {
			return isLifeCycleEvent(info.name) || info.name === 'On';
		});

		for (let decorator of decorators) {
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
		if (isLifeCycleEvent(decorator.name)) {
			if (this.lifeCycleEventHandler) {
				ProcessingContext.linter.error(
					errorMessages.lifecycle.multipleLifeCycleHandlersDefinedForMethod(this.name, this.lifeCycleEventHandler),
					this.method
				);

				return;
			}

			ProcessingContext.store.addLifeCycleHandler(this.method, decorator.name as LifeCycleEvent);

			this.lifeCycleEventHandler = decorator.name as LifeCycleEvent;

			this.defineDecorator(decorator);

			return;
		}

		this.defineDecorator(decorator);
	}

	private defineDecorator(decorator: SignatureMetaDecoratorInfo) {
		this.decorators[decorator.name] = decorator;

		this.decoratorMeta[decorator.name] = {
			n : decorator.name,
			p : decorator.parameters.map(p => ({n : p.name, v : p.value})),
		}
	}

	public toMetaObject() {
		return {
			n : this.name,
			p : this.params.map(p => ({n : p.name, t : p.type, dv : p.defaultValue})),
			d : this.decoratorMeta,
			h : this.lifeCycleEventHandler,
		};
	}
}
