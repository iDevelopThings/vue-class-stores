export enum LoggerLevel {
	Error,
	Warn,
	Info,
	Success,
	Debug,
}

const baseStyle = [
	"color: #fff",
	"background-color: #444",
	"padding: 4px 6px",
	"border-radius: 4px",
	"font-size: 12px",
	"font-weight: bold",
];
const logStyles = {
	[LoggerLevel.Debug] : [
		...baseStyle,
		"background-color: #444",
	],
	[LoggerLevel.Info]  : [
		...baseStyle,
		"background-color: #0ea5e9",
	],
	[LoggerLevel.Success]  : [
		...baseStyle,
		"background-color: #059669",
	],
	[LoggerLevel.Warn]  : [
		...baseStyle,
		"background-color: #f59e0b",
		"color: #000",
	],
	[LoggerLevel.Error] : [
		...baseStyle,
		"background-color: #ef4444",
	],
};

export class LoggerInstance {

	private level: LoggerLevel = LoggerLevel.Success;
	private _label: string     = '';

	setLevel(level: LoggerLevel) {
		this.level = level;
	}

	private canLog(level: LoggerLevel) {
		return this.level >= level;
	}

	public label(label: string) {
		const inst = new LoggerInstance();
		inst.setLevel(this.level);
		inst.setLabel(label);
		return inst;
	}

	private logMessage(level: LoggerLevel, ...args: any[]) {
		if (!this.canLog(level)) {
			return;
		}
		const style     = logStyles[level].join(';') + ';';
		const levelName = LoggerLevel[level].toUpperCase();

		const padAmount = 5 - (levelName.length);
		let textPad = padAmount > 0 ? ' '.repeat(padAmount) : '';

		const parts = [
			// Error label
			`%c${levelName}`, style, textPad
		];

		if (this._label) {
			parts.push(`${this._label} - `);
		}

		console.log(...parts, ...args);
	}

	debug(...args: any[]) {
		this.logMessage(LoggerLevel.Debug, ...args);
	}

	info(...args: any[]) {
		this.logMessage(LoggerLevel.Info, ...args);
	}

	success(...args: any[]) {
		this.logMessage(LoggerLevel.Success, ...args);
	}

	warn(...args: any[]) {
		this.logMessage(LoggerLevel.Warn, ...args);
	}

	error(...args: any[]) {
		this.logMessage(LoggerLevel.Error, ...args);
	}

	private setLabel(label: string): void {
		this._label = label;
	}
}

export const Logger = new LoggerInstance();
