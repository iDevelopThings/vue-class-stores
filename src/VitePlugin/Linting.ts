import ts from 'typescript';
import {CodeSnippet} from "./ErrorMessages";
import {colors} from "./Logger";

type LintingMessageType = 'error' | 'warning' | 'info';

interface LintingMessage {
	type: LintingMessageType;
	messages: string | string[] | (string | CodeSnippet)[];
	start: number;
	end: number;
	codeSnippet: null | { code: string, location: string, startLine: number };
}

function snippetExampleAsComment(codeExample: CodeSnippet): string {
	let codeExampleSnippet = codeExample.content.split("\n");

	codeExample.exampleText.split("\n")
		.forEach((line, i) => {
			codeExampleSnippet.unshift(
				colors.Wrap(colors.Dim, colors.WrapUnderscore('// ' + line))
			);
		});

	let final = codeExampleSnippet.join('\n');
	if (codeExample.includeCodeSnippetLocation === 'before') {
		final = '\n' + final;
	} else {
		final = final + '\n';
	}

	return final;
}

function printCodeLines(
	code: string,
	startLineNumber: number  = 0,
	maxLines: number         = 10,
	codeExample: CodeSnippet = null,
): number {
	const snippetLines = code.split("\n");

	let i = 0;

	if (codeExample && codeExample?.includeCodeSnippet && codeExample?.includeCodeSnippetLocation === 'after') {
		i = printCodeLines(snippetExampleAsComment(codeExample), i);
		maxLines += i;
	}

	for (i; i < snippetLines.length; i++) {
		const line    = snippetLines[i];
		const lineNum = (i + startLineNumber + 1).toString().padStart(3, ' ');

		if (i > maxLines) {
			let j = 0;
			for (j; j < 3; j++) {
				const cutoffNum = (i + j + startLineNumber + 1).toString().padStart(3, ' ');
				process.stdout.write(colors.Dim + cutoffNum + colors.Reset + ' | ' + colors.Dim + '.'.repeat(3 - j) + colors.Reset);
				process.stdout.write("\n");
			}

			i = j;
			break;
		}

		process.stdout.write(colors.Dim + lineNum + colors.Reset + ' | ' + line);
		process.stdout.write("\n");
	}

	if (codeExample && codeExample?.includeCodeSnippet && codeExample?.includeCodeSnippetLocation === 'before') {
		printCodeLines(snippetExampleAsComment(codeExample), (snippetLines.length) + 2);
	}

	return i;
}

export class Linter {

	public static messages: LintingMessage[] = [];

	private _sourceFile: ts.SourceFile;
	private _messages: LintingMessage[] = [];

	constructor(public isMainInstance: boolean = true) {

	}

	factory(sourceFile: ts.SourceFile): Linter {
		const inst       = new Linter(false);
		inst._sourceFile = sourceFile;
		return inst;
	}

	merge() {
		Linter.messages = Linter.messages.concat(this._messages);
	}


//	public info(messages: string, node: ts.Node): void;
//	public info(messages: string[], node: ts.Node): void;
	public info(messages: string | string[] | (string|CodeSnippet)[], node: ts.Node): void {
		this._add(messages, node, 'info');
	}


//	public warn(messages: string, node: ts.Node): void;
//	public warn(messages: string[], node: ts.Node): void;
	public warn(messages: string | string[] | (string|CodeSnippet)[], node: ts.Node): void {
		this._add(messages, node, 'warning');
	}

//	public error(messages: string, node: ts.Node): void;
//	public error(messages: string[], node: ts.Node): void;
	public error(messages: string | string[] | (string | CodeSnippet)[], node: ts.Node): void {
		this._add(messages, node, 'error');
	}

	private _add(messages: string | string[] | (string | CodeSnippet)[], node: ts.Node, type: LintingMessageType) {
		if (typeof messages === 'string') {
			messages = [messages];
		}

		const message: LintingMessage = {
			type        : type,
			messages    : messages,
			start       : node.getStart(this._sourceFile),
			end         : node.getEnd(),
			codeSnippet : null,
		};

		if (message.start !== -1) {
			const nodeText = this._sourceFile.text.slice(message.start, message.end);
			const filePos  = this._sourceFile.getLineAndCharacterOfPosition(message.start);

			message.codeSnippet = {
				startLine : filePos.line,
				code      : nodeText.trim(),
				location  : `${this._sourceFile.fileName}:${filePos.line + 1}:${filePos.character}`,
			};
		}

		this._messages.push(message);
	}

	public reset(): void {
		Linter.messages = [];
	}

	public print(): void {
		if (!this.isMainInstance) {
			throw new Error('Cannot print from a non-main instance');
		}

		if (Linter.messages.length === 0) {
			return;
		}

		const messages  = Linter.messages;
		Linter.messages = [];

		const [width, height] = process.stdout.getWindowSize();
		for (let message of messages) {
			// Write our message type banner
			const bannerText  = '[' + message.type.toUpperCase() + ']';
			const bannerWidth = width - bannerText.length;
			const banner      = colors.WrapBgForLog(message.type, bannerText + (' '.repeat(bannerWidth)));
			process.stdout.write(banner);
			process.stdout.write("\n");

			let messageExampleSnippet: CodeSnippet = null;
			let messageLines                       = [];
			for (let messageLine of message.messages) {
				if ((messageLine as any) instanceof CodeSnippet) {
					messageExampleSnippet = (messageLine as any);
					continue;
				}
				messageLines.push(' ' + messageLine);
			}

			process.stdout.write(messageLines.join('\n'));
			process.stdout.write("\n");

			if (messageExampleSnippet && !messageExampleSnippet?.includeCodeSnippet) {
				process.stdout.write("\n");
				process.stdout.write(colors.Underscore + messageExampleSnippet.exampleText + colors.Reset);
				process.stdout.write("\n");
				printCodeLines('\n' + messageExampleSnippet.content + '\n');
				process.stdout.write("\n");
			}

			if (message.codeSnippet) {
				process.stdout.write("\n");
				process.stdout.write(colors.Underscore + "Location:" + colors.Reset);
				process.stdout.write("\n");
				process.stdout.write(colors.Dim + message.codeSnippet.location + colors.Reset);
				process.stdout.write("\n");
				process.stdout.write("\n");

				printCodeLines(
					message.codeSnippet.code,
					message.codeSnippet.startLine,
					10,
					messageExampleSnippet?.canIncludeCodeSnippet ? messageExampleSnippet : null,
				);

				process.stdout.write("\n");

				//				if (messageExampleSnippet?.includeCodeSnippet && messageExampleSnippet?.includeCodeSnippetLocation === 'before') {
				//					process.stdout.write("\n");
				//					process.stdout.write(colors.Underscore + messageExampleSnippet.exampleText + colors.Reset);
				//					process.stdout.write("\n");
				//					printCodeLines('\n' + messageExampleSnippet.content + '\n');
				//					process.stdout.write("\n");
				//				}

			}

		}
	}
}

export const Linting = new Linter();
