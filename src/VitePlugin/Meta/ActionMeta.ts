import ts from "typescript";
import {TS} from "../TS";

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

	constructor(method: ts.MethodDeclaration, name: string) {
		this.method = method;
		this.name   = name;

		this.signature = TS.typeChecker.getSignatureFromDeclaration(this.method);

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
			name   : this.name,
			params : this.params
		};
	}

}
