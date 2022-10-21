import ts, {ClassDeclaration} from 'typescript';
import {extendsStore} from "./AstHelpers/Classes";
import {hasDecorator} from "./AstHelpers/Modifiers";
import {createImportNode} from "./Builders/Imports";
import {createNodeFromValue, newClassInstance} from "./Builders/Object";
import {StoreMeta} from "./Meta/StoreMeta";

const {factory} = ts;

type StoreDefinition = {
	name: string;
	store: StoreMeta;
	declaration: ClassDeclaration
}

class TestContext {
	public context: ts.TransformationContext;
	public sourceFile: ts.SourceFile;

	public stores: Map<string, StoreDefinition> = new Map();

	constructor(context: ts.TransformationContext, sourceFile: ts.SourceFile) {
		this.context    = context;
		this.sourceFile = sourceFile;
	}

	addStore(declaration: ts.ClassDeclaration) {
		const name = declaration.name?.getText() ?? 'unknown';
		const meta = new StoreMeta(this.sourceFile);
		this.stores.set(name, {name, store : meta, declaration});

		return meta;
	}
}

export function isTestingEnv() {
	return process?.env?.NODE_ENV === 'test';
}

let testContext = new TestContext(undefined, undefined);

export default function TransformerFactory(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return function (context: ts.TransformationContext) {
		testContext = new TestContext(context, undefined);

		return function (sourceFile: ts.SourceFile) {
			testContext.sourceFile = sourceFile;

			if (!isTestingEnv()) {
				return sourceFile;
			}

			if (
				!sourceFile.fileName.toLowerCase().endsWith('spec.ts') &&
				!sourceFile.fileName.toLowerCase().endsWith('test.ts')
			) {
				return sourceFile;
			}

			// Locate any store definitions inside the test file, when we find one, we'll add it to the "TestContext"
			sourceFile = visitNodeAndChildren(sourceFile, program, context);

			if (testContext.stores.size === 0) {
				return sourceFile;
			}

			return factory.updateSourceFile(
				sourceFile,
				[
					// Ensure we import the classes needed for metadata
					createImportNode(['StoreManager', 'StoreMetaData', 'StoreMetaActionData', 'StoreMetaGetterSetterData'], '@idevelopthings/vue-class-stores/vue'),
					...sourceFile.statements,
				],
				false,
				sourceFile.referencedFiles,
				sourceFile.typeReferenceDirectives,
				sourceFile.hasNoDefaultLib,
				sourceFile.libReferenceDirectives
			);


			return sourceFile;
		};
	};
}


function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node | undefined;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node | undefined {
	return ts.visitEachChild(visitNode(node, program), childNode => visitNodeAndChildren(childNode, program, context), context);
}

function visitNode(node: ts.SourceFile, program: ts.Program): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined {
	const typeChecker = program.getTypeChecker();

	if (!ts.isClassDeclaration(node)) return node;

	if (!ts.canHaveDecorators(node)) return node;
	if (!hasDecorator(node, 'TestStore')) return node;
	if (!extendsStore(node)) return node;

	const store = testContext.addStore(node);

	store.process(node);

	const metaMethod = factory.createMethodDeclaration(
		undefined,
		undefined,
		factory.createIdentifier("___getMetaData"),
		undefined,
		undefined,
		[],
		undefined,
		factory.createBlock([
			factory.createReturnStatement(
				newClassInstance("StoreMetaData", [createNodeFromValue(store.toMetaObject())])
			)], true
		)
	);

	node = factory.updateClassDeclaration(
		node,
		node.modifiers,
		node.name,
		node.typeParameters,
		node.heritageClauses,
		[...node.members, metaMethod]
	);

	return node;
}
