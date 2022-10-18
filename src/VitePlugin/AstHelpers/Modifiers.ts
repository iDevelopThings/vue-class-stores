import ts from 'typescript';
import type {ModifierLike, NodeArray} from "typescript";


export function isStatic(modifiers: NodeArray<ModifierLike>) {
	return modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
}

export function isPublicOrPrivate(modifiers: NodeArray<ModifierLike>) {
	if (!modifiers) {
		return true;
	}

	return modifiers?.some(m => { return m.kind === ts.SyntaxKind.PublicKeyword || m.kind === ts.SyntaxKind.PrivateKeyword; });
}


export function hasDecorator(node: { modifiers?: NodeArray<ModifierLike> }, name:string) {
	if (!node?.modifiers?.length) {
		return false;
	}
	return node.modifiers?.some(m => {
		if (!ts.isDecorator(m)) return false;
		if (ts.isCallExpression(m.expression)) {
			return m.expression?.expression?.getText()?.toLowerCase() === name.toLowerCase();
		}
		if (ts.isIdentifier(m.expression)) {
			return m.expression?.getText()?.toLowerCase() === name.toLowerCase();
		}
		return false;
	});

}
