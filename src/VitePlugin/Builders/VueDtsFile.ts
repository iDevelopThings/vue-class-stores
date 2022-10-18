import ts from "typescript";
import {StoreMeta} from "../Meta/StoreMeta";
import {createRelativeImportNode} from "./Imports";
const {factory} = ts;

export function createVueDtsFile(stores: StoreMeta[]): ts.Node[] {
	/**
	 * This code will generate the following:
	 *
	 * declare module "@vue/runtime-core" {
	 *   import {storeExportName} from "./StoreName";
	 * 	 interface ComponentCustomProperties {
	 * 		$storeVueBinding: typeof storeExportName;
	 * 	 }
	 * }
	 *
	 * export {};
	 */

	/**
	 * This will generate:
	 * $storeVueBinding: typeof storeExportName;
	 */
	const componentProperties = stores.map(store => factory.createPropertySignature(
		undefined,
		factory.createIdentifier(store.vueBinding),
		undefined,
		factory.createTypeQueryNode(factory.createIdentifier(store.exportName), undefined)
	));

	/**
	 * This will generate our imports:
	 * import {storeExportName} from "./StoreName";
	 */
	const storeImports = stores.map(
		store => createRelativeImportNode([store.exportName], store.relStoreFilePath)
	);

	/**
	 * This will generate the main declare module/interface block
	 */
	const declareModuleBlock = factory.createModuleDeclaration(
		[factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
		factory.createStringLiteral("@vue/runtime-core"),
		factory.createModuleBlock([
			...storeImports,
			factory.createInterfaceDeclaration(
				undefined,
				factory.createIdentifier("ComponentCustomProperties"),
				undefined,
				undefined,
				componentProperties
			)
		]),
		ts.NodeFlags.ExportContext /*| ts.NodeFlags.Ambient*/ | ts.NodeFlags.ContextFlags
	);

	return [
		declareModuleBlock,
		factory.createExportDeclaration(
			undefined,
			false,
			factory.createNamedExports([]),
			undefined,
			undefined
		),
	];
}
