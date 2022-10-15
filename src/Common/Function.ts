export const noop = () => {};


export function pipe(...fns: ((next: (...args) => any, ...args) => any)[]) {
	const mainCallback = fns.pop();

	return (...args) => {
		let nextFunc    = noop;
		let currentArgs = args;

		for (let i = fns.length - 1; i >= 0; i--) {
			nextFunc = fns[i].bind(null, nextFunc, ...currentArgs);
		}
		return mainCallback(nextFunc, ...args);
	};
}
