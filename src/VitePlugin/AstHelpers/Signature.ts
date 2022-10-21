import ts from "typescript";
import {TS} from "../TS";

export type SignatureMetaParamInfo = {
	name: string,
	type: string,
	defaultValue: string,
}
export type SignatureMetaDecoratorInfo = {
	name: string;
	parameters: { name: string, value: string }[];
}
export type SignatureMetaInfo = {
	name: string,
	parameters: SignatureMetaParamInfo[],
}

export function extractDecoratorsFromSignature(method: ts.MethodDeclaration, validatorFunc?: (decorator: ts.Decorator, info: SignatureMetaDecoratorInfo) => boolean): SignatureMetaDecoratorInfo[] {
	const decorators = ts.canHaveDecorators(method)
		? ts.getDecorators(method)
		: undefined;

	if (!decorators) {
		return [];
	}

	const decoratorsInfo = [];

	for (let decorator of decorators) {
		const expression = decorator.expression;

		const decoratorInfo = {
			name       : undefined,
			parameters : [],
		};

		if (ts.isCallExpression(expression)) {
			const sig = TS.typeChecker.getResolvedSignature(expression);
			if (sig) {
				decoratorInfo.name = expression.expression.getText();
				if (sig.parameters?.length) {
					for (let i = 0; i < sig.parameters.length; i++) {
						const parameterName  = sig.parameters[i].name;
						const parameterValue = expression.arguments[i].getText();

						decoratorInfo.parameters[i] = {
							name  : parameterName,
							value : parameterValue,
						};
					}
				}
			}

		}

		if (ts.isIdentifier(expression)) {
			decoratorInfo.name = expression.getText();
		}

		if (decoratorInfo.name === undefined) {
			continue;
		}
		if (validatorFunc && !validatorFunc(decorator, decoratorInfo)) {
			continue;
		}

		decoratorsInfo.push(decoratorInfo);
	}

	return decoratorsInfo;
}

export function extractDefaultValue(parameter: ts.Symbol): string | undefined {
	if (!ts.isParameter(parameter.valueDeclaration)) return undefined;
	if (!parameter.valueDeclaration.initializer) return undefined;

	return parameter.valueDeclaration.initializer.getText();
}

export function extractSignatureMeta(method: ts.MethodDeclaration): SignatureMetaInfo {
	const signature = TS.typeChecker.getSignatureFromDeclaration(method);

	const result: SignatureMetaInfo = {
		name       : (method as any).name.text,
		parameters : [],
	};

	result.parameters = signature.parameters.map(param => {
		return {
			name         : param.name,
			type         : TS.typeChecker.typeToString(TS.typeChecker.getTypeOfSymbolAtLocation(param, param.valueDeclaration)),
			defaultValue : extractDefaultValue(param),
		};
	});

	return result;
}
