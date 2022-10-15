export type Prev = [
	never,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	...0[]
];

export type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}${"" extends P ? "" : "."}${P}`
		: never
	: never;

export type Paths<T, D extends number = 10> = [D] extends [never]
	? never
	: T extends object
		? {
			[K in keyof T]-?: K extends string | number
				? T[K] extends Function ? never : `${K}` | Join<K, Paths<T[K], Prev[D]>>
				: never;
		}[keyof T]
		: "";

export type Leaves<T, D extends number = 10> = [D] extends [never]
	? never
	: T extends object
		? { [K in keyof T]-?: (T[K] extends Function ? never : Join<K, Leaves<T[K], Prev[D]>>) }[keyof T]
		: "";

export type PathsFor<K, T> = K extends keyof T ? Paths<T> : never;

export type AtPath<TPath extends string, TIn> = TPath extends keyof TIn
	? TIn[TPath]
	: TPath extends `${infer THead}.${infer TTail}`
		? THead extends keyof TIn
			? AtPath<TTail, TIn[THead]>
			: never
		: never;

export type PathImpl<T, K extends keyof T> =
	K extends string
		? T[K] extends Record<string, any>
			? T[K] extends ArrayLike<any>
				? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
				: K | `${K}.${PathImpl<T[K], keyof T[K]>}`
			: K
		: never;

export type Path<T> = PathImpl<T, keyof T> | keyof T;

export type PathValue<T, P extends Path<T>> =
	P extends `${infer K}.${infer Rest}`
		? K extends keyof T
			? Rest extends Path<T[K]>
				? PathValue<T[K], Rest>
				: never
			: never
		: P extends keyof T
			? T[P]
			: never;

