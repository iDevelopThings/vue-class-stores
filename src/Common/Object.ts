import {isReactive, isRef} from "vue";
import type {DeepPartial} from "./Types";

export function isPlainObject<O extends Record<string, any>>(value: O | unknown): value is O
export function isPlainObject(obj: any): obj is object {
	return (
		obj &&
		typeof obj === 'object' &&
		Object.prototype.toString.call(obj) === '[object Object]' &&
		typeof obj.toJSON !== 'function'
	);
}

export function mergeReactiveObjects<T extends Record<any, unknown> | Map<unknown, unknown> | Set<unknown>>(
	target: T,
	patchToApply: DeepPartial<T>
): T {
	// Handle Map instances
	if (target instanceof Map && patchToApply instanceof Map) {
		patchToApply.forEach((value, key) => target.set(key, value));
	}
	// Handle Set instances
	if (target instanceof Set && patchToApply instanceof Set) {
		patchToApply.forEach(target.add, target);
	}

	// no need to go through symbols because they cannot be serialized anyway
	for (const key in patchToApply) {
		if (!patchToApply.hasOwnProperty(key)) continue;
		const subPatch    = patchToApply[key];
		const targetValue = target[key];
		if (
			isPlainObject(targetValue) &&
			isPlainObject(subPatch) &&
			target.hasOwnProperty(key) &&
			!isRef(subPatch) &&
			!isReactive(subPatch)
		) {
			//@ts-ignore
			target[key] = mergeReactiveObjects(targetValue, subPatch);
		} else {
			// @ts-expect-error: subPatch is a valid value
			target[key] = subPatch;
		}
	}

	return target;
}
