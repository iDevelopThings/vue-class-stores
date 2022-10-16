import ts from 'typescript';
import {Context} from "../Generator";
import {infoLog} from "../Logger";
import {createNodeFromValue} from "./Object";

const {factory} = ts;


export function createConstVariableNode(name: string, value: any, isNode: boolean = false, isExport: boolean = false) {
	const node = isNode ? value : createNodeFromValue(value);

	return factory.createVariableStatement(
		isExport ? [factory.createModifier(ts.SyntaxKind.ExportKeyword)] : undefined,
		factory.createVariableDeclarationList([
				factory.createVariableDeclaration(
					factory.createIdentifier(name),
					undefined,
					undefined,
					node
				)
			], ts.NodeFlags.Const
		)
	);
}
