const timings = new Map<string, number>();

export function startTimer(name: string) {
	if (!process.env.DEBUG_MODE) {
		return;
	}

	timings.set(name, Date.now());
}

export function endTimer(name: string) {
	if (!process.env.DEBUG_MODE) {
		return;
	}

	const start = timings.get(name);
	if (start == null) {
		throw new Error(`Timer ${name} was never started`);
	}

	const end      = Date.now();
	const duration = end - start;
	console.log(`${name} took ${duration}ms`);

	timings.delete(name);
}

export const Timed = {
	start : startTimer,
	end   : endTimer,
	func  : (name: string, cb: () => any, id?: string) => {
		startTimer(name + (id ?? ''));
		const result = cb();
		if(result instanceof Promise) {
			result.then(() => endTimer(name + (id ?? '')));
		} else {
			endTimer(name + (id ?? ''));
		}
	}
};
