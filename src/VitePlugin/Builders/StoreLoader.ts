import path from "path";
import ts from "typescript";
import {StoreMeta} from "../Meta/StoreMeta";
import {createImportNode, formatImportString} from "./Imports";
import {createNodeFromValue, newClassInstance} from "./Object";

const {factory} = ts;

export function createStoreLoaderModule(stores: StoreMeta[]) {
	const imports = [
		createImportNode(['StoreManager', 'StoreMetaData', 'StoreMetaActionData', 'StoreMetaGetterSetterData'], '@idevelopthings/vue-class-stores/vue'),
	];

	const storeMetaObjects = stores.map(store => {
		return newClassInstance("StoreMetaData", [createNodeFromValue(store.toMetaObject())]);
	});

	const storeMetaExport = factory.createVariableStatement(
		[factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		factory.createVariableDeclarationList([
				factory.createVariableDeclaration(
					factory.createIdentifier("stores"),
					undefined,
					undefined,
					factory.createArrayLiteralExpression(storeMetaObjects, false)
				)
			], ts.NodeFlags.Const
		)
	);

	return [
		...imports,
		storeMetaExport,
		//		createConstVariableNode("stores", stores.map(store => store.toMetaObject()), false, true),
		//		createBootStoresFunction(),
		//		createViteHotAccept(stores)
	];

}

/**
 * Creates our boot function which is like:
 *
 * export function bootStores(app: App) {
 * 	StoreManager.boot(app, stores);
 * }
 *
 * @returns {ts.FunctionDeclaration}
 */
function createBootStoresFunction() {
	return factory.createFunctionDeclaration(
		[factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		undefined,
		factory.createIdentifier("bootStores"),
		undefined,
		[factory.createParameterDeclaration(
			undefined,
			undefined,
			factory.createIdentifier("app"),
			undefined,
			factory.createTypeReferenceNode(
				factory.createIdentifier("App"),
				undefined
			),
			undefined
		)],
		undefined,
		factory.createBlock(
			[factory.createExpressionStatement(factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier("StoreManager"),
					factory.createIdentifier("boot")
				),
				undefined,
				[
					factory.createIdentifier("app"),
					factory.createIdentifier("stores")
				]
			))],
			true
		)
	);
}


function createViteHotAccept(stores: StoreMeta[]) {

	const storeImports = stores.map(
		store => factory.createStringLiteral(formatImportString(store.loaderImportPath))
	);

	//	storeImports.push(factory.createStringLiteral(
	//		formatImportString(path.relative(path.dirname(PluginConfig.storeLoaderPath), PluginConfig.storeLoaderPath))
	//	))

	return factory.createIfStatement(
		factory.createPropertyAccessExpression(
			factory.createMetaProperty(
				ts.SyntaxKind.ImportKeyword,
				factory.createIdentifier("meta")
			),
			factory.createIdentifier("hot")
		),
		factory.createBlock(
			[factory.createExpressionStatement(factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createPropertyAccessExpression(
						factory.createMetaProperty(
							ts.SyntaxKind.ImportKeyword,
							factory.createIdentifier("meta")
						),
						factory.createIdentifier("hot")
					),
					factory.createIdentifier("accept")
				),
				undefined,
				[
					factory.createArrayLiteralExpression(storeImports, false),
					factory.createArrowFunction(
						undefined,
						undefined,
						[factory.createParameterDeclaration(
							undefined,
							undefined,
							factory.createIdentifier("modules"),
							undefined,
							undefined,
							undefined
						)],
						undefined,
						factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
						factory.createBlock([
								factory.createExpressionStatement(factory.createCallExpression(
									factory.createPropertyAccessExpression(
										factory.createIdentifier("console"),
										factory.createIdentifier("log")
									),
									undefined,
									[
										factory.createStringLiteral("stores updated"),
										factory.createIdentifier("modules")
									]
								)),
								factory.createExpressionStatement(factory.createCallExpression(
									factory.createPropertyAccessExpression(
										factory.createIdentifier("StoreManager"),
										factory.createIdentifier("handleHotReload")
									),
									undefined,
									[factory.createIdentifier("modules")]
								))
							], true
						)
					)
				]
			))],
			true
		),
		undefined
	);
}
