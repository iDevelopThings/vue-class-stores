export declare function cleanUrl(url: string): string;
/**
 * @see https://github.com/rich-harris/magic-string
 */
export declare class MagicString {
    str: string;
    private overwrites;
    private starts;
    private ends;
    constructor(str: string);
    append(content: string): this;
    prepend(content: string): this;
    overwrite(start: number, end: number, content: string): this;
    toString(): string;
}
/**
 * - `'' -> '.'`
 * - `foo` -> `./foo`
 */
export declare function relativeify(relative: string): string;
/**
 * Ast tree walk
 */
export declare function walk<T = Record<string, any>>(ast: T, visitors: {
    [type: string]: (node: T, ancestors: T[]) => void | Promise<void>;
}, ancestors?: T[]): Promise<void>;
export declare namespace walk {
    var sync: <T = Record<string, any>>(ast: T, visitors: {
        [type: string]: (node: T, ancestors: T[]) => void;
    }, ancestors?: T[]) => void;
}
export declare function normalizePath(id: string): string;
