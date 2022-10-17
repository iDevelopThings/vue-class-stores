import path from 'node:path';
import os from 'node:os';
export function cleanUrl(url) {
    const queryRE = /\?.*$/s;
    const hashRE = /#.*$/s;
    return url.replace(hashRE, '').replace(queryRE, '');
}
/**
 * @see https://github.com/rich-harris/magic-string
 */
export class MagicString {
    private str: any;
    private starts: string;
    private ends: string;
    private overwrites: any;
    constructor(str) {
        this.str = str;
        this.starts = '';
        this.ends = '';
    }
    append(content) {
        this.ends += content;
        return this;
    }
    prepend(content) {
        this.starts = content + this.starts;
        return this;
    }
    overwrite(start, end, content) {
        if (end < start) {
            throw new Error(`"end" con't be less than "start".`);
        }
        if (!this.overwrites) {
            this.overwrites = [];
        }
        this.overwrites.push({ loc: [start, end], content });
        return this;
    }
    toString() {
        let str = this.str;
        if (this.overwrites) {
            const arr = [...this.overwrites].sort((a, b) => b.loc[0] - a.loc[0]);
            for (const { loc: [start, end], content } of arr) {
                // TODO: check start or end overlap
                str = str.slice(0, start) + content + str.slice(end);
            }
        }
        return this.starts + str + this.ends;
    }
}
/**
 * - `'' -> '.'`
 * - `foo` -> `./foo`
 */
export function relativeify(relative) {
    if (relative === '') {
        return '.';
    }
    if (!relative.startsWith('.')) {
        return './' + relative;
    }
    return relative;
}
/**
 * Ast tree walk
 */
export async function walk(ast, visitors, ancestors = []) {
    var _a;
    if (!ast)
        return;
    if (Array.isArray(ast)) {
        for (const element of ast) {
            await walk(element, visitors, ancestors);
        }
    }
    else {
        ancestors = ancestors.concat(ast);
        for (const key of Object.keys(ast)) {
            await (typeof ast[key] === 'object' && walk(ast[key], visitors, ancestors));
        }
    }
    await ((_a = visitors[ast.type]) === null || _a === void 0 ? void 0 : _a.call(visitors, ast, ancestors));
}
walk.sync = function walkSync(ast, visitors, ancestors = []) {
    var _a;
    if (!ast)
        return;
    if (Array.isArray(ast)) {
        for (const element of ast) {
            walkSync(element, visitors, ancestors);
        }
    }
    else {
        ancestors = ancestors.concat(ast);
        for (const key of Object.keys(ast)) {
            typeof ast[key] === 'object' && walkSync(ast[key], visitors, ancestors);
        }
    }
    (_a = visitors[ast.type]) === null || _a === void 0 ? void 0 : _a.call(visitors, ast, ancestors);
};
const isWindows = os.platform() === 'win32';
function slash(p) {
    return p.replace(/\\/g, '/');
}
export function normalizePath(id) {
    return path.posix.normalize(isWindows ? slash(id) : id);
}
