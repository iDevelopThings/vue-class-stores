import {createExportName, formatVueBindingName} from "../Common";
import {colors} from "./Logger";

export class CodeSnippet {
	constructor(
		public content: string                                = '',
		public exampleText: string                            = 'Example:',
		public includeCodeSnippet: boolean                    = false,
		public includeCodeSnippetLocation: 'after' | 'before' = null,
	) {}

	get canIncludeCodeSnippet() {
		return this.includeCodeSnippet && this.includeCodeSnippetLocation;
	}
}

export const errorMessages = {

	stateGetter : {
		publicOrPrivate    : () => [
			`The 'state' property must be public or private.`,
			new CodeSnippet(`get state(): IMyStoreType {\n\treturn { ... }\n}`),
		],
		nonStatic          : () => [
			`The 'state' property must not be static.`,
			new CodeSnippet(`get state(): IMyStoreType {\n\treturn { ... }\n}`),
		],
		invalidBody        : () => [
			`The 'state' getter must have a body with a single return object statement.`,
			new CodeSnippet(`get state(): IMyStoreType {\n\treturn { ... }\n}`),
		],
		mustBeGetter       : () => [
			`The 'state' property must be a JS/TS getter.`,
			new CodeSnippet(`get state(): IMyStoreType {\n\treturn { ... }\n}`),
		],
		missingStateGetter : (className: string) => [
			'Could not find state getter object for store: ' + className,
			'Ensure you have a state object for your store',
			new CodeSnippet(`get state() : IMyStateType {\n\treturn { ... };\n}`),
		]
	},
	store       : {
		missingExport : (className: string) => [
			'Could not find export for your store: ' + colors.WrapBold(className),
			'You need to define an export for your store class so it can be used',
			new CodeSnippet(
				`export const ${createExportName(className)} = new ${className}();`,
				'For example, add this to the end of your module:',
				true,
				'before',
			),
		]
	}

};
