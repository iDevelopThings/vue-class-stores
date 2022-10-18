import ts from "typescript";
import {LifeCycleEvent} from "../../Common/LifeCycle";
import {hasDecorator} from "../AstHelpers/Modifiers";
import {errorMessages} from "../ErrorMessages";
import {Linter} from "../Linting";
import {TS} from "../TS";
import {StoreMeta} from "./StoreMeta";

export class ActionMeta {
	/**
	 * The name of the method
	 * @type {string}
	 */
	public name: string;
	/**
	 * The parameters of the method
	 * @type {any[]}
	 */
	public params = [];

	/**
	 * If we defined a lifecycle decorator on the method, we'll return it here
	 *
	 * @type {LifeCycleEvent}
	 */
	public lifeCycleEventHandler: LifeCycleEvent;

	/**
	 * Typescript AST for the method
	 * @type {ts.MethodDeclaration}
	 * @private
	 */
	private method: ts.MethodDeclaration;

	/**
	 * Typescript AST for the method signature
	 * @type {ts.Signature}
	 * @private
	 */
	private signature: ts.Signature;

	constructor(method: ts.MethodDeclaration, linter: Linter, store: StoreMeta) {
		this.method = method;
		this.name   = (method as any).name.text;

		this.signature = TS.typeChecker.getSignatureFromDeclaration(this.method);

		if (method.modifiers?.length) {
			for (let lifeCycleEvent of Object.values(LifeCycleEvent)) {
				if (hasDecorator(method, lifeCycleEvent)) {
					if (this.lifeCycleEventHandler) {
						linter.error(errorMessages.lifecycle.multipleLifeCycleHandlersDefined(this.name, store.className, this.lifeCycleEventHandler), method);
						break;
					}

					store.addLifeCycleHandler(this.method, lifeCycleEvent);

					this.lifeCycleEventHandler = lifeCycleEvent;
				}
			}
		}

		for (let parameter of this.signature.parameters) {

			let defaultValue = undefined;
			if (ts.isParameter(parameter.valueDeclaration)) {
				if (parameter.valueDeclaration.initializer) {
					defaultValue = parameter.valueDeclaration.initializer.getText();
				}
			}

			this.params.push({
				name : parameter.name,
				type : TS.typeChecker.typeToString(TS.typeChecker.getTypeAtLocation(parameter.valueDeclaration)),
				defaultValue,
			});
		}
	}

	toJSON() {
		return {
			name                  : this.name,
			params                : this.params,
			lifeCycleEventHandler : this.lifeCycleEventHandler,
		};
	}

}
