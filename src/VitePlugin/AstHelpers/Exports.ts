import ts from 'typescript';

export function isExportConst(statement: ts.Statement): [is: boolean, constName: string] {
	if (!ts.isVariableStatement(statement)) return [false, undefined];
	if (!statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) return [false, undefined];
	if (!statement?.declarationList?.declarations?.length) return [false, undefined];

	const declaration = statement.declarationList.declarations[0];
	if (!ts.isIdentifier(declaration.name)) return [false, undefined];

	return [true, declaration.name.text];
}
