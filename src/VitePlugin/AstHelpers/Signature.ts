import ts from "typescript";
import {TS} from "../TS";

export type SignatureMetaParamInfo = {
	name: string,
	type: string,
	defaultValue: string,
}
export type SignatureMetaDecoratorInfo = {
	name: string;
	parameters: string[];
}
export type SignatureMetaInfo = {
	name: string,
	parameters: SignatureMetaParamInfo[],
}

export function extractDecoratorsFromSignature(method: ts.MethodDeclaration, validatorFunc?: (decorator: ts.Decorator) => boolean): SignatureMetaDecoratorInfo[] {
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
			decoratorInfo.name       = expression.expression.getText();
			decoratorInfo.parameters = expression.arguments.map(arg => arg.getText());
		}

		if (ts.isIdentifier(expression)) {
			decoratorInfo.name = expression.getText();
		}

		if (decoratorInfo.name === undefined) {
			continue;
		}
		if (validatorFunc && !validatorFunc(decorator)) {
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
