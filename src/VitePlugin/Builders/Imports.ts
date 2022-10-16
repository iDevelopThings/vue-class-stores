import ts from 'typescript';

const {factory} = ts;

export function formatImportString(importString: string, isRelativeImport: boolean = true) {
	if (importString.endsWith('.ts')) {
		importString = importString.substring(0, importString.length - 3);
	}
	if (!importString.startsWith('./') && isRelativeImport) {
		importString = './' + importString;
	}

	return importString;
}

export function createImportNode(importNames: string[], specifier: string, isTypeOnly: boolean = false) {
	return factory.createImportDeclaration(
		undefined,
		factory.createImportClause(
			false,
			undefined,
			factory.createNamedImports(
				importNames.map(name => factory.createImportSpecifier(isTypeOnly, undefined, factory.createIdentifier(name)))
			)
		),
		factory.createStringLiteral(specifier),
		undefined
	);
}

/**
 * importNames = import {this, is, the, names} from 'x';
 *
 * @param {string[]} importNames
 * @param {string} relativeFilePath
 * @param {boolean} isTypeOnly
 * @returns {ts.ImportDeclaration}
 */
export function createRelativeImportNode(importNames: string[], relativeFilePath: string, isTypeOnly: boolean = false) {
	return createImportNode(importNames, formatImportString(relativeFilePath, true), isTypeOnly);
}

export function createLazyImportGlobNode(importPath:string) {
	return factory.createArrowFunction(
		undefined,
		undefined,
		[],
		undefined,
		factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
		factory.createCallExpression(
			factory.createPropertyAccessExpression(
				factory.createMetaProperty(
					ts.SyntaxKind.ImportKeyword,
					factory.createIdentifier("meta")
				),
				factory.createIdentifier("glob")
			),
			undefined,
			[
				factory.createStringLiteral(importPath),
				factory.createObjectLiteralExpression(
					[factory.createPropertyAssignment(
						factory.createIdentifier("eager"),
						factory.createTrue()
					)],
					false
				)
			]
		)
	);
}
