import ts from "typescript";

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
