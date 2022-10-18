import ts from "typescript";
import {PluginConfig} from "./PluginConfig";
import {Timed} from "./Utils/Timed";

class TSInstance {

	public program: ts.Program;
	public compilerHost: ts.CompilerHost;
	public printer: ts.Printer;
	public typeChecker: ts.TypeChecker;

	private getTsConfObj() {
		return Object.assign({}, PluginConfig.tsConfig.options, {
			types     : [],
			typeRoots : [],
			lib       : [],
		});
	}

	public setup() {
		Timed.start('ts.setup');

		this.compilerHost = ts.createCompilerHost(this.getTsConfObj());
		this.program      = ts.createProgram(PluginConfig.storeFilePaths, this.getTsConfObj(), this.compilerHost);

		this.printer     = ts.createPrinter({newLine : ts.NewLineKind.LineFeed});
		this.typeChecker = this.program.getTypeChecker();

		Timed.end('ts.setup');
	}

	public rebuild(): void {
		Timed.start('ts.rebuild');

		this.setup();

		Timed.end('ts.rebuild');
	}
}

export const TS = new TSInstance();
