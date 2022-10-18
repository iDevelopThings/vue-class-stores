import ts from "typescript";
import {PluginConfig} from "./PluginConfig";
import {Timed} from "./Utils/Timed";

class TSInstance {

	public program: ts.Program;
	public compilerHost: ts.CompilerHost;
	public printer: ts.Printer;
	public typeChecker: ts.TypeChecker;

	public setup() {
		Timed.start('ts.setup');

		const tsConf = Object.assign({}, PluginConfig.tsConfig.options, {
			types     : [],
			typeRoots : [],
			lib       : [],
		});

		this.compilerHost = ts.createCompilerHost(tsConf);
		this.program      = ts.createProgram(PluginConfig.storeFilePaths, tsConf, this.compilerHost);

		this.printer     = ts.createPrinter({newLine : ts.NewLineKind.LineFeed});
		this.typeChecker = this.program.getTypeChecker();

		Timed.end('ts.setup');
	}

}

export const TS = new TSInstance();
