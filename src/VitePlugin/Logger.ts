import chalk from "chalk";

const RESET      = '\x1b[0m';
const LOG_PREFIX = chalk.cyanBright(`[VUE CLASS STORES]`);

export function successLog(...args: unknown[]) {
	console.log(
		chalk.greenBright(' ✓'),
		args.map(a => chalk.dim(a)).join(' '),
		RESET
	);
}

export function errorLog(...args: unknown[]) {
	console.log(
		chalk.redBright(' ✗'),
		args.map(a => chalk.dim(a)).join(' '),
		RESET
	);
}

export function infoLog(...args: unknown[]) {
	console.log(
		chalk.blueBright(' i'),
		args.map(a => chalk.dim(a)).join(' '),
		RESET
	);
}

export function basicLog(...args: unknown[]) {
	console.log(
		args.map(a => chalk.dim(a)).join(' '),
		RESET
	);
}

export function warnLog(...args: unknown[]) {
	const segments = [/*LOG_PREFIX,*/ chalk.yellowBright(' !')].join('');
	console.log(segments, args.map(a => chalk.dim(a)).join(' '));
}
