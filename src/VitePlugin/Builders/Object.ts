import ts from "typescript";
import {Context} from "../Generator";

const {factory} = ts;

/**
 * This will convert the object passed to it, to typescript AST nodes so it can be printed.
 * Ex:
 * createObjectNode({key : value});
 *
 * @param obj
 * @returns {ts.ObjectLiteralExpression}
 */
export function createObjectNode(obj: any) {
	return factory.createObjectLiteralExpression(Object.entries(obj).map(([key, value]) => {
		return factory.createPropertyAssignment(factory.createIdentifier(key), createNodeFromValue(value));
	}), true);
}

export function createNodeFromValue(value: any) {
	let nodeResult = null;
	if (value instanceof UnwrappableNode) {
		nodeResult = value.node;
	} else if (typeof value == "undefined") {
		nodeResult = factory.createIdentifier("undefined");
	} else if (value === null) {
		nodeResult = factory.createIdentifier("null");
	} else if (typeof value == "string") {
		nodeResult = factory.createStringLiteral(value);
	} else if (typeof value == "number") {
		nodeResult = factory.createNumericLiteral(value);
	} else if (typeof value == "boolean") {
		nodeResult = value ? factory.createTrue() : factory.createFalse();
	} else if (typeof value == "bigint") {
		nodeResult = factory.createBigIntLiteral(value as any);
	} else if (typeof value == "symbol") {
		nodeResult = factory.createIdentifier(value.toString());
	} else if (Array.isArray(value)) {
		nodeResult = factory.createArrayLiteralExpression(value.map(createNodeFromValue));
	} else if (typeof value == "object") {
		nodeResult = createObjectNode(value);
	}

	if (!nodeResult) {
		throw new Error("Unknown value type: " + typeof value);
	}

//	Context.printNode(nodeResult);

	return nodeResult;
}


export class UnwrappableNode {
	constructor(public node: ts.Node) {
	}
}

export function unwrappableNode(node: ts.Node) {
	return new UnwrappableNode(node);
}
