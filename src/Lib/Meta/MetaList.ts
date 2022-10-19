import {LifeCycleEvent} from "../../Common/LifeCycle";
import type {StoreMetaActionData} from "./StoreMetaActionData";

export class MetaList<IType, T = { [key: string]: IType }> {
	
	#items: T = {} as T;
	
	#keys: string[];
	#values: IType[];
	#entries: [string, IType][];
	
	constructor(items: T) {
		this.#items = items;
	}
	
	has(key: string): boolean {
		return this.#items.hasOwnProperty(key);
	}
	
	get(key: string): IType {
		return this.#items[key];
	}
	
	set(key: string, value: IType) {
		this.#items[key] = value;
		
		// Reset the caches...
		this.#keys    = undefined;
		this.#values  = undefined;
		this.#entries = undefined;
	}
	
	items(): T {
		return this.#items;
	}
	
	keys(): string[] {
		if (!this.#keys) {
			this.#keys = Object.keys(this.#items);
		}
		return this.#keys;
	}
	
	values(): IType[] {
		if (!this.#values) {
			this.#values = Object.values(this.#items);
		}
		return this.#values;
	}
	
	entries(): [string, IType][] {
		if (!this.#entries) {
			this.#entries = Object.entries(this.#items);
		}
		return this.#entries;
	}
	
	map<TCallback extends (value: IType, key: string) => any>(callback: TCallback): ReturnType<TCallback>[] {
		const mapped = [];
		for (const [key, value] of this.entries()) {
			mapped.push(callback(value, key));
		}
		return mapped;
	}
	
	filter<TCallback extends (value: IType, key: string) => boolean>(callback: TCallback): IType[] {
		const filtered: IType[] = [];
		for (const [key, value] of this.entries()) {
			if (callback(value, key)) {
				filtered.push(value);
			}
		}
		return filtered;
	}
	
	each<TCallback extends (value: IType, key: string) => any>(callback: TCallback): void {
		for (const [key, value] of this.entries()) {
			callback(value, key);
		}
	}
	
	* [Symbol.iterator](): IterableIterator<[string, IType]> {
		for (const [key, value] of this.entries()) {
			yield [key, value];
		}
	}
}


export class MetaActionList extends MetaList<StoreMetaActionData> {
	#lifeCycleHandlers: { [K in keyof LifeCycleEvent]: StoreMetaActionData };
	
	lifeCycleHandlers() {
		if (this.#lifeCycleHandlers) {
			return this.#lifeCycleHandlers;
		}
		
		this.#lifeCycleHandlers = {} as any;
		for (const [key, value] of this.entries()) {
			if (value.lifeCycleEvent) {
				this.#lifeCycleHandlers[value.lifeCycleEvent] = value;
			}
		}
		
		
	}
}
