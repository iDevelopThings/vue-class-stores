import ts from "typescript";
import {errorMessages} from "../ErrorMessages";
import {Linter} from "../Linting";
import {ProcessingContext} from "../Utils/ProcessingContext";
import {isPublicOrPrivate, isStatic} from "./Modifiers";

/**
 * Check if our class extends the main Store class
 * Ex:
 *
 * export class MyStore extends Store<MyStore, IMyStoreState>
 *
 * @param {ts.ClassDeclaration} classDeclaration
 * @returns {boolean | undefined}
 */
export function extendsStore(classDeclaration: ts.ClassDeclaration) {
	if (!ts.isClassDeclaration(classDeclaration)) return false;

	return classDeclaration.heritageClauses?.some(h => {
		if (h.token !== ts.SyntaxKind.ExtendsKeyword)
			return false;

		return h.types.some(t => {
			if (!ts.isExpressionWithTypeArguments(t)) return false;
			if (!ts.isCallExpression(t.expression)) return false;

			const callExpression = t.expression;
			if (!ts.isIdentifier(callExpression.expression)) return false;

			return callExpression.expression.text?.toLowerCase() === "store";
		});
	});
}

/**
 * Check if our class member is the:
 * `public static vueBinding = 'x';` statement
 *
 * If it is, return true & the value of this property
 *
 * @param {ts.ClassElement} member
 * @returns {[is: boolean, binding: string]}
 */
export function isVueBinding(member: ts.ClassElement): [is: boolean, binding: string] {
	if (!ts.isPropertyDeclaration(member)) return [false, undefined];
	if (!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)) return [false, undefined];
	if (!ts.isIdentifier(member.name)) return [false, undefined];
	if (member.name.text !== 'vueBinding') return [false, undefined];
	if (!ts.isStringLiteral(member.initializer)) return [false, undefined];

	return [member.name.text === "vueBinding", member.initializer.text];
}


export function isStateGetterNode(member: ts.ClassElement): [is: boolean, obj: ts.ObjectLiteralExpression] {
	const result: [is: boolean, obj: ts.ObjectLiteralExpression] = [false, undefined];

	if (ts.isPropertyDeclaration(member)) return result;
	if (!ts.isIdentifier(member.name)) return result;
	if (member.name.text !== 'state') return result;

	// Ensure our state getter is actually a getter
	if (!ts.isGetAccessor(member)) {
		ProcessingContext.linter.error(errorMessages.stateGetter.mustBeGetter(), member);

		return result;
	}

	// Ensure it's defined as public or private
	if (!isPublicOrPrivate(member.modifiers)) {
		ProcessingContext.linter.error(errorMessages.stateGetter.publicOrPrivate(), member);

		return result;
	}

	// Ensure it's not static
	if (isStatic(member.modifiers)) {
		ProcessingContext.linter.error(errorMessages.stateGetter.nonStatic(), member);

		return result;
	}

	const body = member.body;
	if (!ts.isBlock(body)) return result;

	const statements = body.statements;
	if (statements.length !== 1) {
		ProcessingContext.linter.error(errorMessages.stateGetter.invalidBody(), member);
		return result;
	}

	const statement = statements[0];
	if (!ts.isReturnStatement(statement)) {
		ProcessingContext.linter.error(errorMessages.stateGetter.invalidBody(), member);
		return result;
	}

	if (!ts.isObjectLiteralExpression(statement.expression)) {
		ProcessingContext.linter.error(errorMessages.stateGetter.invalidBody(), member);
		return result;
	}

	return [true, statement.expression];
}
